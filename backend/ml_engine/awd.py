"""
AWD (Alternate Wetting and Drying) Detection Module
=====================================================
Analyzes NDWI time series to detect AWD irrigation patterns 
and estimate water savings potential.
"""
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def detect_awd_from_ndwi(
    ndwi_series: List[Dict], 
    wet_threshold: float = 0.3, 
    dry_threshold: float = 0.2, 
    min_cycles: int = 1
) -> Dict[str, Any]:
    """
    Detect AWD (Alternate Wetting and Drying) patterns from NDWI time series.
    Includes adaptive thresholding for high NDWI baselines.
    """
    if not ndwi_series or len(ndwi_series) < 2:
        return {
            "awd_detected": False,
            "error": "Insufficient data for AWD detection",
            "recommendation": "Collect more satellite imagery data for accurate analysis"
        }
    
    vals = [e.get("NDWI", 0) for e in ndwi_series if e.get("NDWI") is not None]
    if not vals:
        return {"awd_detected": False, "cycles_count": 0}

    peak = max(vals)
    bottom = min(vals)
    
    # Adaptive Thresholding
    if peak > 0.5 and bottom > dry_threshold:
        adaptive_dry = peak * 0.8  # 20% drop from peak
    else:
        adaptive_dry = dry_threshold

    # Track state transitions
    state = None  # 'wet' or 'dry'
    cycles = 0
    dry_days_count = 0
    wet_days_count = 0
    
    for i, entry in enumerate(ndwi_series):
        val = entry.get("NDWI", 0)
        date = entry.get("date", f"day_{i}")
        
        if val is None:
            continue
        
        # Determine current state
        if val >= wet_threshold:
            if state == "dry":
                # Transition from dry to wet = complete cycle
                cycles += 1
            state = "wet"
            wet_days_count += 1
        elif val <= adaptive_dry:
            state = "dry"
            dry_days_count += 1
    
    # AWD detection
    awd_detected = cycles >= min_cycles
    
    total_observations = len(ndwi_series)
    dry_ratio = dry_days_count / total_observations if total_observations > 0 else 0
    
    # Estimate water savings
    eff = 0.0
    if awd_detected:
        eff = 1.0 if cycles >= 2 else 0.6
    elif dry_days_count > 0:
        eff = min(0.3, dry_ratio * 0.5)

    base_water_savings_percent = eff * 30
    methane_reduction_percent = eff * 50
    
    avg_ndwi = float(np.mean(vals)) if vals else 0
    
    # Recommendations
    if awd_detected:
        recommendation = "AWD practice detected! Your regular wet-dry cycles maximize water savings and reduce methane emissions."
    elif dry_days_count > 0:
        recommendation = "Partial drying detected. Increase the frequency and length of dry periods to qualify for more carbon credits."
    else:
        recommendation = "Field appears consistently wet. Implementing AWD (periodic drying) can save up to 30% water and 50% methane emissions."
    
    return {
        "awd_detected": awd_detected,
        "cycles_count": cycles,
        "dry_days_detected": dry_days_count,
        "wet_days_detected": wet_days_count,
        "total_observations": total_observations,
        "dry_ratio": round(dry_ratio, 3),
        "estimated_water_savings_percent": round(base_water_savings_percent, 1),
        "estimated_methane_reduction_percent": round(methane_reduction_percent, 1),
        "statistics": {
            "avg_ndwi": round(avg_ndwi, 4),
            "peak": round(peak, 4),
            "bottom": round(bottom, 4),
            "thresholds": {"wet": wet_threshold, "dry": adaptive_dry, "is_adaptive": adaptive_dry != dry_threshold}
        },
        "recommendation": recommendation,
        "benefits": {
            "water_savings": f"~{round(base_water_savings_percent)}% saved" if eff > 0 else "Potential 15-30% savings",
            "emissions": f"~{round(methane_reduction_percent)}% reduction" if eff > 0 else "Potential 30-50% reduction",
            "yield": "Maintains yields while saving costs"
        }
    }


def calculate_awd_score(awd_result: Dict) -> float:
    """
    Convert AWD detection result to a sustainability score (0-1).
    
    Higher scores indicate better water management practices.
    """
    if not awd_result.get("awd_detected"):
        return 0.3  # Base score for non-AWD fields
    
    cycles = awd_result.get("cycles_count", 0)
    dry_ratio = awd_result.get("dry_ratio", 0)
    
    # Score components
    cycle_score = min(1.0, cycles / 5)  # Max out at 5 cycles
    ratio_score = min(1.0, dry_ratio * 2)  # Optimal around 50% dry
    
    # Penalize if too dry (crops need water!)
    if dry_ratio > 0.6:
        ratio_score *= 0.8
    
    return round(0.5 + (cycle_score * 0.3) + (ratio_score * 0.2), 3)


# Example usage
if __name__ == "__main__":
    # Sample NDWI series for testing
    sample_data = [
        {"date": "2026-01-01", "NDWI": 0.35},
        {"date": "2026-01-08", "NDWI": 0.32},
        {"date": "2026-01-15", "NDWI": 0.18},  # Dry
        {"date": "2026-01-22", "NDWI": 0.15},  # Dry
        {"date": "2026-01-29", "NDWI": 0.34},  # Wet again
        {"date": "2026-02-05", "NDWI": 0.38},
        {"date": "2026-02-12", "NDWI": 0.17},  # Dry
        {"date": "2026-02-19", "NDWI": 0.35},  # Wet
    ]
    
    result = detect_awd_from_ndwi(sample_data)
    print(f"AWD Detected: {result['awd_detected']}")
    print(f"Cycles: {result['cycles_count']}")
    print(f"Recommendation: {result['recommendation']}")