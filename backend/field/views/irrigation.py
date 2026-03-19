"""
Smart Irrigation Scheduler views for KrishiSaarthi.
AI-powered irrigation recommendations based on weather and soil data.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta
import requests
import logging

from field.models import FieldData, IrrigationLog, IrrigationSource
from field.serializers import IrrigationLogSerializer

logger = logging.getLogger(__name__)


class IrrigationScheduleView(APIView):
    """
    GET: Returns 7-day irrigation schedule with AI recommendations
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        field_id = request.query_params.get('field_id')
        
        if not field_id:
            return Response({'error': 'field_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            field = FieldData.objects.get(id=field_id, user=request.user)
        except FieldData.DoesNotExist:
            return Response({'error': 'Field not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get weather data for 5 days (OWM free tier limit)
        weather_data = self._get_weather_forecast(field)
        
        # Get recent irrigation logs
        recent_logs = IrrigationLog.objects.filter(
            field=field,
            date__gte=timezone.now().date() - timedelta(days=7)
        ).order_by('-date')
        
        # Generate recommendations
        schedule = []
        today = timezone.now().date()
        
        for i in range(5):
            target_date = today + timedelta(days=i)
            day_weather = weather_data.get(i, {})
            
            # Check if irrigated on this day
            log_on_day = recent_logs.filter(date=target_date).first()
            
            recommendation = self._get_recommendation(
                day_weather=day_weather,
                crop_type=field.cropType,
                was_irrigated=log_on_day is not None,
                days_since_last_irrigation=self._days_since_last_irrigation(field, target_date)
            )
            
            schedule.append({
                'date': target_date.isoformat(),
                'day_of_week': target_date.strftime('%A'),
                'weather': {
                    'temp_max': day_weather.get('temp_max'),
                    'temp_min': day_weather.get('temp_min'),
                    'rain_chance': day_weather.get('rain_chance', 0),
                    'rain_mm': day_weather.get('rain_mm', 0),
                    'humidity': day_weather.get('humidity'),
                    'description': day_weather.get('description', 'Clear'),
                    'icon': day_weather.get('icon', '01d')
                },
                'recommendation': recommendation,
                'irrigated': log_on_day is not None,
                'log': IrrigationLogSerializer(log_on_day).data if log_on_day else None
            })
        
        # Calculate summary
        summary = {
            'water_used_this_week': sum(
                float(log.water_amount or 0) for log in recent_logs
            ),
            'irrigation_count': recent_logs.count(),
            'next_recommended_irrigation': next(
                (s['date'] for s in schedule if s['recommendation']['action'] == 'irrigate'),
                None
            )
        }
        
        return Response({
            'field_id': field.id,
            'field_name': field.name,
            'crop_type': field.cropType,
            'schedule': schedule,
            'summary': summary
        })
    
    def _get_weather_forecast(self, field):
        """Fetch 5-day weather forecast using OpenWeatherMap"""
        import os
        from django.conf import settings
        try:
            # Get field centroid from polygon (handles multiple formats)
            lat, lng = self._get_field_centroid(field)
            logger.info(f"Weather fetch for field '{field.name}' at lat={lat:.4f}, lng={lng:.4f}")
            
            # Try multiple sources for the API key
            api_key = os.environ.get('OPENWEATHER_API_KEY', '')
            if not api_key or api_key == 'your-openweather-api-key-here':
                api_key = getattr(settings, 'OPENWEATHER_API_KEY', '')
            
            if not api_key or api_key == 'your-openweather-api-key-here':
                logger.warning("OPENWEATHER_API_KEY not set, using stable mock weather")
                return self._get_mock_weather(lat, lng)
            
            url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lng}&appid={api_key}&units=metric"
            
            response = requests.get(url, timeout=8)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Weather API success: {len(data.get('list', []))} forecast entries")
                return self._parse_weather_data(data)
            else:
                logger.warning(f"Weather API returned {response.status_code}: {response.text[:200]}")
        except Exception as e:
            logger.warning(f"Weather API error: {e}")
        
        lat, lng = self._get_field_centroid(field)
        return self._get_mock_weather(lat, lng)
    
    def _parse_weather_data(self, data):
        """Parse OpenWeatherMap 5-day/3-hour forecast, aggregate per day"""
        from collections import defaultdict
        today = datetime.now().date()
        daily = defaultdict(lambda: {
            'temps_max': [], 'temps_min': [], 'humidities': [],
            'rain_chances': [], 'rain_mms': [],
            'descriptions': [], 'icons': []
        })
        
        for item in data.get('list', []):
            dt = datetime.fromtimestamp(item['dt'])
            day_index = (dt.date() - today).days
            if 0 <= day_index < 7:
                d = daily[day_index]
                d['temps_max'].append(item['main']['temp_max'])
                d['temps_min'].append(item['main']['temp_min'])
                d['humidities'].append(item['main']['humidity'])
                d['rain_chances'].append(item.get('pop', 0) * 100)
                d['rain_mms'].append(item.get('rain', {}).get('3h', 0))
                d['descriptions'].append(item['weather'][0]['description'])
                d['icons'].append(item['weather'][0]['icon'])
        
        weather = {}
        for day_index, d in daily.items():
            # Pick the most common description (midday preference)
            desc = d['descriptions'][len(d['descriptions']) // 2] if d['descriptions'] else 'Clear'
            icon = d['icons'][len(d['icons']) // 2] if d['icons'] else '01d'
            weather[day_index] = {
                'temp_max': round(max(d['temps_max']), 1) if d['temps_max'] else None,
                'temp_min': round(min(d['temps_min']), 1) if d['temps_min'] else None,
                'humidity': round(sum(d['humidities']) / len(d['humidities'])) if d['humidities'] else None,
                'rain_chance': round(max(d['rain_chances'])) if d['rain_chances'] else 0,
                'rain_mm': round(sum(d['rain_mms']), 1) if d['rain_mms'] else 0,
                'description': desc,
                'icon': icon
            }
        return weather
    
    def _get_mock_weather(self, lat=20.59, lng=78.96):
        """
        Return deterministic mock weather based on date + location.
        Uses date as seed so values stay the SAME on page refresh,
        but change naturally day-to-day.
        """
        import hashlib
        today = datetime.now().date()
        
        # Base temp varies by month (Indian climate patterns)
        month = today.month
        # Approximate max temps by month for central India
        monthly_base_max = {
            1: 28, 2: 31, 3: 35, 4: 39, 5: 42, 6: 38,
            7: 33, 8: 32, 9: 33, 10: 34, 11: 31, 12: 28
        }
        monthly_base_min = {
            1: 14, 2: 16, 3: 20, 4: 25, 5: 28, 6: 27,
            7: 25, 8: 24, 9: 24, 10: 22, 11: 18, 12: 14
        }
        # Monsoon months have higher rain chance
        monsoon_rain = {
            1: 5, 2: 5, 3: 8, 4: 10, 5: 15, 6: 60,
            7: 80, 8: 75, 9: 60, 10: 30, 11: 10, 12: 5
        }
        
        descriptions_by_rain = {
            'high': ['Moderate Rain', 'Light Rain', 'Thunderstorm', 'Heavy Rain'],
            'medium': ['Cloudy', 'Overcast', 'Light Rain', 'Partly Cloudy'],
            'low': ['Clear', 'Partly Cloudy', 'Haze', 'Clear']
        }
        icons_by_rain = {
            'high': ['10d', '09d', '11d'],
            'medium': ['04d', '03d', '10d'],
            'low': ['01d', '02d', '50d']
        }
        
        base_max = monthly_base_max.get(month, 32)
        base_min = monthly_base_min.get(month, 22)
        base_rain_pct = monsoon_rain.get(month, 20)
        
        weather = {}
        for i in range(7):
            target_date = today + timedelta(days=i)
            # Create a deterministic hash from the date + location
            seed_str = f"{target_date.isoformat()}_{lat:.2f}_{lng:.2f}_krishi"
            seed_hash = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
            
            # Deterministic "random" variations using the hash
            temp_var = (seed_hash % 7) - 3          # -3 to +3 variation
            rain_var = (seed_hash % 30) - 15        # -15 to +15 variation
            humid_var = (seed_hash % 20) - 10       # -10 to +10 variation
            desc_idx = seed_hash % 4                # pick description
            
            temp_max = max(25, min(45, base_max + temp_var))
            temp_min = max(10, min(30, base_min + (seed_hash % 5) - 2))
            rain_chance = max(0, min(100, base_rain_pct + rain_var))
            humidity = max(30, min(95, 55 + humid_var + (15 if rain_chance > 50 else 0)))
            rain_mm = round(rain_chance * 0.15, 1) if rain_chance > 40 else 0
            
            if rain_chance > 60:
                desc_category = 'high'
            elif rain_chance > 30:
                desc_category = 'medium'
            else:
                desc_category = 'low'
            
            description = descriptions_by_rain[desc_category][desc_idx % len(descriptions_by_rain[desc_category])]
            icon = icons_by_rain[desc_category][desc_idx % len(icons_by_rain[desc_category])]
            
            weather[i] = {
                'temp_max': temp_max,
                'temp_min': temp_min,
                'humidity': humidity,
                'rain_chance': rain_chance,
                'rain_mm': rain_mm,
                'description': description,
                'icon': icon
            }
        return weather
    
    def _get_field_centroid(self, field):
        """
        Extract centroid (lat, lng) from field polygon.
        Handles multiple formats:
        - GeoJSON: {"type": "Polygon", "coordinates": [[[lng, lat], ...]]}
        - Simple dict list: [{"lat": ..., "lng": ...}, ...]
        - Coordinate list: [[lng, lat], ...]
        """
        polygon = field.polygon
        coords = []
        
        # GeoJSON format: {"type": "Polygon", "coordinates": [[[lng, lat], ...]]}
        if isinstance(polygon, dict):
            raw_coords = polygon.get('coordinates', [])
            # GeoJSON Polygon has coordinates as [ring1, ring2, ...] where ring is [[lng,lat],...]
            if raw_coords and isinstance(raw_coords[0], list):
                ring = raw_coords[0]  # outer ring
                for point in ring:
                    if isinstance(point, (list, tuple)) and len(point) >= 2:
                        coords.append((point[1], point[0]))  # GeoJSON is [lng, lat]
        
        # Simple dict list: [{"lat": ..., "lng": ...}, ...]
        elif isinstance(polygon, list) and len(polygon) > 0:
            if isinstance(polygon[0], dict):
                for p in polygon:
                    coords.append((p.get('lat', 0), p.get('lng', 0)))
            elif isinstance(polygon[0], (list, tuple)):
                for p in polygon:
                    if len(p) >= 2:
                        coords.append((p[1], p[0]))  # [lng, lat] → (lat, lng)
        
        if coords:
            lat = sum(c[0] for c in coords) / len(coords)
            lng = sum(c[1] for c in coords) / len(coords)
            return lat, lng
        
        logger.warning(f"Could not parse polygon for field '{field.name}', using default coords")
        return 20.5937, 78.9629  # Default to central India
    
    def _days_since_last_irrigation(self, field, target_date):
        """Calculate days since last irrigation before target date"""
        last_log = IrrigationLog.objects.filter(
            field=field,
            date__lt=target_date
        ).order_by('-date').first()
        
        if last_log:
            return (target_date - last_log.date).days
        return 999  # Never irrigated
    
    def _get_recommendation(self, day_weather, crop_type, was_irrigated, days_since_last_irrigation):
        """
        AI logic to determine irrigation recommendation.
        Returns: action (irrigate/skip/monitor), confidence, reason
        """
        rain_chance = day_weather.get('rain_chance', 0)
        rain_mm = day_weather.get('rain_mm', 0)
        temp_max = day_weather.get('temp_max', 30)
        
        # Crop water requirements (days between irrigation)
        crop_intervals = {
            'Rice': 2,
            'Wheat': 5,
            'Cotton': 7,
            'Sugarcane': 7,
            'Vegetables': 2,
            'Pulses': 4,
        }
        ideal_interval = crop_intervals.get(crop_type, 3)
        
        # Decision logic
        if was_irrigated:
            return {
                'action': 'done',
                'icon': '✅',
                'confidence': 100,
                'reason': 'Already irrigated today'
            }
        
        # Skip if rain expected
        if rain_chance >= 70 and rain_mm >= 5:
            return {
                'action': 'skip',
                'icon': '🌧️',
                'confidence': min(90, rain_chance),
                'reason': f'Rain expected ({rain_chance}% chance, ~{rain_mm}mm)'
            }
        
        # Irrigate if overdue
        if days_since_last_irrigation >= ideal_interval:
            urgency = min(95, 50 + (days_since_last_irrigation - ideal_interval) * 10)
            return {
                'action': 'irrigate',
                'icon': '💧',
                'confidence': urgency,
                'reason': f'{days_since_last_irrigation} days since last irrigation (recommended: every {ideal_interval} days)'
            }
        
        # High temperature warning
        if temp_max >= 35 and days_since_last_irrigation >= ideal_interval - 1:
            return {
                'action': 'irrigate',
                'icon': '🌡️',
                'confidence': 75,
                'reason': f'High temperature ({temp_max}°C) - consider early irrigation'
            }
        
        # Monitor if rain is possible
        if 30 <= rain_chance < 70:
            return {
                'action': 'monitor',
                'icon': '⚠️',
                'confidence': 60,
                'reason': f'Possible rain ({rain_chance}%) - check weather updates'
            }
        
        # Default: skip if recent irrigation
        return {
            'action': 'skip',
            'icon': '⏭️',
            'confidence': 80,
            'reason': f'Next irrigation in {ideal_interval - days_since_last_irrigation} days'
        }


class IrrigationLogView(APIView):
    """
    POST: Log an irrigation event
    GET: Get irrigation history for a field
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        field_id = request.query_params.get('field_id')
        
        logs = IrrigationLog.objects.filter(user=request.user)
        if field_id:
            logs = logs.filter(field_id=field_id)
        
        logs = logs[:30]  # Limit to 30 recent entries
        
        return Response({
            'logs': IrrigationLogSerializer(logs, many=True).data,
            'sources': [{'value': s.value, 'label': s.label} for s in IrrigationSource]
        })
    
    def post(self, request):
        field_id = request.data.get('field_id')
        
        try:
            field = FieldData.objects.get(id=field_id, user=request.user)
        except FieldData.DoesNotExist:
            return Response({'error': 'Field not found'}, status=status.HTTP_404_NOT_FOUND)
        
        log = IrrigationLog.objects.create(
            user=request.user,
            field=field,
            date=request.data.get('date', timezone.now().date()),
            water_amount=request.data.get('water_amount'),
            duration_minutes=request.data.get('duration_minutes'),
            source=request.data.get('source', 'other'),
            notes=request.data.get('notes', '')
        )
        
        return Response(IrrigationLogSerializer(log).data, status=status.HTTP_201_CREATED)
    
    def delete(self, request, pk=None):
        try:
            log = IrrigationLog.objects.get(id=pk, user=request.user)
            log.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IrrigationLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
