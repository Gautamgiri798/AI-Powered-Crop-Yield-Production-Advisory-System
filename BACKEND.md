# KrishiSaarthi Backend Infrastructure

This document outlines the technical architecture and specifications of the KrishiSaarthi backend.

## 🚀 Technology Stack
- **Framework**: Django 4.2+ (Python 3.9+)
- **API**: Django REST Framework (DRF)
- **Database**: PostgreSQL (Production) / SQLite (Local Dev)
- **Authentication**: Token-based authentication
- **Server**: Gunicorn (Production) / Django Dev Server (Local)
- **Task Processing**: Integrated AI/ML pipelines for analysis

## 📁 Application Structure

### 1. `field` (Core Field Management)
- **Models**: `FieldData`, `FieldLog`, `FieldAlert`, `SoilAdvice`.
- **Primary Function**: Manages geospatial field data, satellite analysis (Google Earth Engine integration), and automated health monitoring.
- **Key Modules**:
  - `analysis.py`: Handles EVI/NDVI processing and crop health scoring.
  - `logs_alerts.py`: Manages farmer activity logs and automated system alerts.

### 2. `planning` (Agricultural Intelligence)
- **Models**: `SeasonCalendar`, `InventoryItem`, `LaborEntry`, `Equipment`.
- **Primary Function**: Handles the logic for crop rotation, inventory tracking, and labor management.
- **Key View**: `RotationPlannerView` provides AI-driven crop suggestions based on history and soil parameters.

### 3. `finance` (Economic Systems)
- **Models**: `Budget`, `Income`, `CarbonCredit`.
- **Primary Function**: Tracks farm expenses, profitability (P&L), and manages Carbon Credit calculations based on AWD (Alternate Wetting and Drying) practices.

### 4. `chat` (AI Assistant)
- **Function**: Integrated LLM-based assistant (`KrishiAssistant`) providing real-time agricultural advice.

### 5. `ml_engine` (Specialized AI)
- **Engine**: YOLOv8 & Google Earth Engine APIs.
- **Capabilities**: 
  - Automated Weed/Pest Detection.
  - Crop Yield Prediction.
  - Carbon Credit sequestration estimation.

## 🛠 Development Setup

1. **Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Configuration**:
   Copy `.env.example` to `.env` and configure your:
   - `SECRET_KEY`
   - `DATABASE_URL`
   - `GOOGLE_EARTH_ENGINE_CREDENTIALS`
   - `OPENAI_API_KEY` (for AI Chat)

3. **Database Migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Running**:
   ```bash
   python manage.py runserver
   ```

## 🔒 Security & Performance
- **Isolation**: Each user's field data is strictly isolated via Django's `request.user` filtering.
- **Caching**: Heavy GEE analysis data is cached to prevent redundant API calls.
- **Rate Limits**: Integrated to protect AI analysis endpoints.
