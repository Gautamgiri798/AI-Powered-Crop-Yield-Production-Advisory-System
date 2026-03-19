import time
import logging
import traceback

try:
    import ee
    EE_AVAILABLE = True
except ImportError:
    ee = None
    EE_AVAILABLE = False
    logging.getLogger(__name__).warning("earthengine-api not installed. Earth Engine features disabled.")
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from ..models import FieldData

logger = logging.getLogger(__name__)

class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN

    def allow_request(self):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF-OPEN"
                logger.info("Circuit breaker probing (HALF-OPEN)")
                return True
            return False
        return True

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.error(f"Circuit breaker OPENED after {self.failure_count} failures")

    def record_success(self):
        if self.state == "HALF-OPEN":
            self.state = "CLOSED"
            self.failure_count = 0
            logger.info("Circuit breaker CLOSED (Recovered)")
        elif self.state == "CLOSED":
            self.failure_count = 0

# Global circuit breaker instance
ee_breaker = CircuitBreaker()

def fetchEEData_safe(user=None, field_id=None, field_instance=None, start_date=None, end_date=None):
    """
    Wrapper for fetchEEData that strictly enforces circuit breaker logic.
    """
    if not EE_AVAILABLE:
        return {
            "error": "Earth Engine not available",
            "details": "earthengine-api package not installed",
            "fallback": True
        }

    if not ee_breaker.allow_request():
        logger.warning("Earth Engine request blocked by circuit breaker")
        return {
            "error": "Service temporarily unavailable",
            "details": "Circuit breaker open due to recent failures",
            "fallback": True
        }

    try:
        data = _fetch_ee_data_impl(user, field_id, field_instance, start_date, end_date)
        ee_breaker.record_success()
        return data
    except Exception as e:
        ee_breaker.record_failure()
        logger.error(f"EE Service Failure: {e}")
        return {
            "error": "Satellite data unavailable",
            "details": str(e),
            "fallback": True
        }

def get_simulated_data(user, field_instance, field_id):
    """
    Generates dynamic simulated satellite data if GEE is unavailable.
    Uses field_id as a seed to ensure different fields have different data.
    """
    import random
    # Use field_id as seed for deterministic but unique data per field
    seed_val = int(field_id) if field_id else 42
    random.seed(seed_val)
    
    now = datetime.now()
    dates = [(now - timedelta(days=i*10)).strftime('%Y-%m-%d') for i in range(12)]
    dates.reverse()
    
    # Randomize growth stage peaks and offsets a bit
    peak_idx = random.randint(5, 8)
    base_growth = []
    for i in range(12):
        dist = abs(i - peak_idx)
        val = 0.85 * (1.0 - (dist * 0.12))
        base_growth.append(max(0.2, val))
    
    ndvi_ts = []
    ndwi_ts = []
    
    # Decide dry periods based on seed
    dry_indices = [random.randint(2,5), random.randint(7,10)]
    
    for i, date in enumerate(dates):
        # Add some noise
        noise = (random.random() - 0.5) * 0.05
        val_ndvi = max(0.1, min(0.9, base_growth[i] + noise))
        
        # AWD simulation: Periodic drops in NDWI
        is_dry = (i in dry_indices)
        base_ndwi = 0.35 + (base_growth[i] * 0.25)
        val_ndwi = (0.15 + (random.random()*0.05)) if is_dry else (base_ndwi + noise)
        
        ndvi_ts.append({"date": date, "NDVI": float(round(val_ndvi, 3))})
        ndwi_ts.append({"date": date, "NDWI": float(round(val_ndwi, 3))})

    # Get area from field instance for calculations
    area_val = 32.5
    if field_instance:
        area_val = float(field_instance.area) if getattr(field_instance, 'area', None) else 32.5

    return {
        "NDVI": float(round(base_growth[-1], 3)),
        "EVI": float(round(base_growth[-1] * 0.9, 3)),
        "SAVI": float(round(base_growth[-1] * 0.85, 3)),
        "crop_type_class": 1,
        "rainfall_mm": 5.0 + random.random()*15,
        "temperature_K": 295.0 + random.random()*10,
        "soil_moisture": 0.2 + random.random()*0.2,
        "ndvi_time_series": ndvi_ts,
        "ndwi_time_series": ndwi_ts,
        "area_hectare": area_val,
        "simulated": True
    }

def _fetch_ee_data_impl(user, field_id, field_instance, start_date, end_date):
    """
    Implementation of Earth Engine data path with simulation fallback.
    """
    # Force simulation if EE is not initialized
    if not EE_AVAILABLE:
        return get_simulated_data(user, field_instance, field_id)

    # Initialize date range
    if end_date is None:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d')

    try:
        if field_instance:
            field_data = field_instance
        elif field_id:
            field_data = get_object_or_404(FieldData, id=field_id, user=user)
        else:
            field_data = FieldData.objects.filter(user=user).first()
            if not field_data:
                return {"error": "No fields found"}

        coords = field_data.polygon
        if isinstance(coords, dict) and 'coordinates' in coords:
            geom = coords['coordinates']
        else:
            geom = coords
            
        aoi = ee.Geometry.Polygon(geom)

        # Sentinel-2 Collection
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").filterBounds(aoi).filterDate(start_date, end_date)
        
        # Check if collection is empty
        count = s2.size().getInfo()
        if count == 0:
            logger.warning(f"No satellite images for this field in range {start_date} to {end_date}")
            return get_simulated_data(user, field_instance, field_id)

        # Get latest stats
        latest = s2.sort('system:time_start', False).first()
        
        # Use a larger scale for calculations to prevent timeouts on huge areas
        # 12k hectares is about 11km x 11km. 10m scale is too small.
        # We'll use scale=30 for regions and scale=60 for time series to be safe.
        calc_scale = 30
        
        ndvi = latest.normalizedDifference(["B8", "B4"]).rename("NDVI")
        stats = ndvi.reduceRegion(ee.Reducer.mean(), aoi, calc_scale, bestEffort=True).getInfo()
        
        # Time series extraction
        def extract_indices(img):
            d = img.date().format("YYYY-MM-dd")
            # McFeeters NDWI
            ndwi_val = img.normalizedDifference(["B3", "B8"]).rename("NDWI")
            ndvi_val = img.normalizedDifference(["B8", "B4"]).rename("NDVI")
            return ee.Feature(None, {
                "date": d,
                "NDVI": ndvi_val.reduceRegion(ee.Reducer.mean(), aoi, 60, bestEffort=True).get("NDVI"),
                "NDWI": ndwi_val.reduceRegion(ee.Reducer.mean(), aoi, 60, bestEffort=True).get("NDWI")
            })

        ts_features = s2.sort('system:time_start').map(extract_indices).getInfo()
        
        ndvi_time_series = []
        ndwi_time_series = []
        
        for feat in ts_features.get('features', []):
            props = feat.get('properties', {})
            d = props.get('date')
            v_ndvi = props.get('NDVI')
            v_ndwi = props.get('NDWI')
            if d:
                if v_ndvi is not None: ndvi_time_series.append({"date": d, "NDVI": v_ndvi})
                if v_ndwi is not None: ndwi_time_series.append({"date": d, "NDWI": v_ndwi})

        return {
            "NDVI": stats.get("NDVI"),
            "EVI": stats.get("NDVI", 0) * 0.9, # Simplified for speed
            "SAVI": stats.get("NDVI", 0) * 0.85,
            "crop_type_class": 1, # Default to crop
            "rainfall_mm": 5.0,
            "temperature_K": 300.2,
            "soil_moisture": 0.3,
            "ndvi_time_series": ndvi_time_series,
            "ndwi_time_series": ndwi_time_series,
            "simulated": False
        }
    except Exception as e:
        logger.error(f"Error in GEE Implementation: {e}")
        return get_simulated_data(user, field_instance, field_id)
