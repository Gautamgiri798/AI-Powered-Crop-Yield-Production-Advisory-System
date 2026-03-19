import logging
import requests
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

class WeatherView(APIView):
    """Proxy for OpenWeather API to keep API key server-side"""
    permission_classes = [AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        
        if not lat or not lon:
            return Response(
                {"error": "lat and lon query parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get API key from environment
        api_key = os.environ.get('OPENWEATHER_API_KEY', '')
        if not api_key or api_key == 'your-openweather-api-key-here':
            # Return deterministic mock data based on date + location
            import hashlib
            from datetime import datetime, timedelta
            
            now = datetime.now()
            month = now.month
            
            # Base temps by month (Indian climate)
            max_temps = {1:28,2:31,3:35,4:39,5:42,6:38,7:33,8:32,9:33,10:34,11:31,12:28}
            min_temps = {1:14,2:16,3:20,4:25,5:28,6:27,7:25,8:24,9:24,10:22,11:18,12:14}
            humidities = {1:40,2:35,3:30,4:25,5:35,6:65,7:80,8:82,9:75,10:55,11:45,12:42}
            conditions = {
                1: ("Haze", "haze", "50d"), 2: ("Clear", "clear sky", "01d"),
                3: ("Clear", "clear sky", "01d"), 4: ("Haze", "haze", "50d"),
                5: ("Partly Cloudy", "scattered clouds", "03d"), 6: ("Rain", "moderate rain", "10d"),
                7: ("Rain", "heavy rain", "09d"), 8: ("Clouds", "overcast clouds", "04d"),
                9: ("Clouds", "scattered clouds", "03d"), 10: ("Clear", "clear sky", "01d"),
                11: ("Haze", "haze", "50d"), 12: ("Clear", "clear sky", "01d")
            }
            
            # Deterministic variation from date + location
            seed_str = f"{now.date().isoformat()}_{lat}_{lon}_weather"
            seed_hash = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
            temp_var = (seed_hash % 5) - 2  # -2 to +2
            
            base_max = max_temps.get(month, 32) + temp_var
            base_min = min_temps.get(month, 22) + (seed_hash % 3) - 1
            base_humidity = humidities.get(month, 50) + (seed_hash % 10) - 5
            cond = conditions.get(month, ("Clear", "clear sky", "01d"))
            wind_speed = 2.5 + (seed_hash % 8) * 0.5
            
            # Generate 8 forecast entries (next 24 hours, every 3h)
            forecast_items = []
            for i in range(8):
                ft = now + timedelta(hours=3 * (i + 1))
                f_seed = f"{ft.date().isoformat()}_{ft.hour}_{lat}_{lon}"
                f_hash = int(hashlib.md5(f_seed.encode()).hexdigest()[:8], 16)
                f_temp = base_max - 3 + (f_hash % 6)
                f_cond = conditions.get((month + (f_hash % 2)) % 12 or 12, cond)
                forecast_items.append({
                    "dt": int(ft.timestamp()),
                    "main": {"temp": f_temp, "humidity": base_humidity + (f_hash % 10) - 5},
                    "weather": [{"main": f_cond[0], "description": f_cond[1], "icon": f_cond[2]}],
                    "wind": {"speed": wind_speed + (f_hash % 4) * 0.3}
                })
            
            return Response({
                "current": {
                    "main": {
                        "temp": base_max,
                        "humidity": base_humidity,
                        "pressure": 1008 + (seed_hash % 10)
                    },
                    "weather": [{"main": cond[0], "description": cond[1], "icon": cond[2]}],
                    "wind": {"speed": wind_speed}
                },
                "forecast": forecast_items
            })
        
        try:
            # Current weather
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            weather_res = requests.get(weather_url, timeout=5)
            
            if not weather_res.ok:
                logger.error(f"Weather API error: {weather_res.status_code} - {weather_res.text}")
                return Response({"error": "Failed to fetch weather data"}, status=weather_res.status_code)

            weather_data = weather_res.json()
            
            # Forecast
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            forecast_res = requests.get(forecast_url, timeout=5)
            forecast_data = forecast_res.json().get('list', []) if forecast_res.ok else []
            
            return Response({
                "current": weather_data,
                "forecast": forecast_data
            })
        except requests.RequestException as e:
            logger.error(f"Weather request failed: {str(e)}")
            return Response(
                {"error": "Weather service unreachable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.exception("Unexpected error in WeatherView")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
