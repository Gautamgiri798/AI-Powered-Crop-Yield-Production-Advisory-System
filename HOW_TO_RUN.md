# 🚀 How to Run KrishiSaarthi (AgriSmart) — Step-by-Step Guide

> **Detailed local development setup for Windows**

---

## 📋 Prerequisites

Make sure the following are installed on your system before proceeding:

| Software    | Version | Download Link                     |
| ----------- | ------- | --------------------------------- |
| **Python**  | 3.11+   | https://www.python.org/downloads/ |
| **Node.js** | 18+     | https://nodejs.org/               |
| **Git**     | Latest  | https://git-scm.com/downloads     |

### Optional (for full features)

| Software / Key              | Purpose                         | Link                                     |
| --------------------------- | ------------------------------- | ---------------------------------------- |
| Google Earth Engine Account | Satellite NDVI/EVI analysis     | https://earthengine.google.com/          |
| Gemini API Key              | AI Chatbot, pest image analysis | https://makersuite.google.com/app/apikey |
| OpenWeather API Key         | Live weather data               | https://openweathermap.org/api           |

---

## 📁 Project Structure Overview

```
KrishiSaarthi/
├── backend/          # Django REST API (Python)
│   ├── .env          # Backend environment variables
│   ├── manage.py     # Django management script
│   ├── init_db.py    # Database initialization script
│   └── requirements.txt
│
├── frontend/         # React + Vite Frontend (TypeScript)
│   ├── .env          # Frontend environment variables
│   ├── package.json
│   ├── vite.config.ts
│   └── client/       # React source code
│       └── src/
│
└── HOW_TO_RUN.md     # ← You are here
```

---

## 🔧 Step 1: Clone the Repository

```powershell
git clone https://github.com/yourusername/KrishiSaarthi.git
cd KrishiSaarthi
```

---

## 🐍 Step 2: Backend Setup (Django)

### 2.1 — Open a Terminal and Navigate to Backend

```powershell
cd backend
```

### 2.2 — Create a Python Virtual Environment

```powershell
python -m venv venv
```

### 2.3 — Activate the Virtual Environment

```powershell
.\venv\Scripts\Activate.ps1
```

> **Note:** If you get a PowerShell execution policy error, run this first:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### 2.4 — Install Python Dependencies

```powershell
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

> ⚠️ **Troubleshooting:** If `psycopg2-binary` fails to install, that's OK — it's only needed for PostgreSQL production deployments. The project uses SQLite by default.

### 2.5 — Create the Environment File

```powershell
Copy-Item .env.example -Destination .env
```

Now open `backend/.env` and fill in your API keys:

```env
# Required for AI features (chatbot, pest detection)
GEMINI_API_KEY=your-gemini-api-key-here

# Optional — for live weather data (mock data is used if missing)
OPENWEATHER_API_KEY=your-openweather-api-key-here

# Optional — for satellite data (NDVI, EVI)
# GEE_PROJECT=your-gee-project-id

# Django settings (defaults work for development)
DJANGO_SECRET_KEY=django-insecure-dev-key-for-testing-only
DEBUG=True
```

### 2.6 — Initialize the Database

```powershell
python init_db.py
```

This script will:

- Run all database migrations
- Create a default superuser (`admin` / `admin123`)
- Collect static files

Alternatively, you can run migrations manually:

```powershell
python manage.py makemigrations
python manage.py migrate
```

### 2.7 — (Optional) Authenticate Google Earth Engine

If you have a GEE account and want satellite data features:

```powershell
earthengine authenticate
```

> Without this, the app will gracefully degrade — satellite features will show fallback/demo data.

### 2.8 — Start the Backend Server

```powershell
python manage.py runserver 8080
```

> **Important:** We use port **8080** because port 8000 may require admin permissions on some Windows machines.

You should see:

```
Starting development server at http://127.0.0.1:8080/
Quit the server with CTRL-BREAK.
```

✅ **Backend is running at:** http://localhost:8080

> Verify it's working by visiting http://localhost:8080/health — you should see `{"status": "healthy"}`

---

## ⚛️ Step 3: Frontend Setup (React + Vite)

### 3.1 — Open a **New Terminal** and Navigate to Frontend

```powershell
cd frontend
```

> ⚠️ **Keep the backend terminal running!** Open a separate terminal for the frontend.

### 3.2 — Install Node.js Dependencies

```powershell
npm install
```

### 3.3 — Create the Environment File

```powershell
Copy-Item .env.example -Destination .env
```

Now open `frontend/.env` and set it to:

```env
VITE_API_BASE_URL=
```

> **Why is it empty?** The Vite dev server proxies all API requests to the backend at port 8080 automatically. Keeping this empty ensures all API calls flow through the proxy, avoiding CORS issues.

### 3.4 — Start the Frontend Dev Server

```powershell
npm run dev
```

You should see:

```
VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

✅ **Frontend is running at:** http://localhost:5173

---

## 🌐 Step 4: Access the Application

Open your browser and navigate to:

| Page             | URL                             |
| ---------------- | ------------------------------- |
| **Landing Page** | http://localhost:5173/          |
| **Login**        | http://localhost:5173/login     |
| **Sign Up**      | http://localhost:5173/signup    |
| **Dashboard**    | http://localhost:5173/dashboard |
| **Backend API**  | http://localhost:8080/          |
| **Admin Panel**  | http://localhost:8080/admin     |
| **Health Check** | http://localhost:8080/health    |

### Default Admin Credentials

If you ran `init_db.py`, a superuser was created:

| Field    | Value      |
| -------- | ---------- |
| Username | `admin`    |
| Password | `admin123` |

> You can create your own account through the **Sign Up** page at http://localhost:5173/signup

---

## 🔁 Quick Start (After Initial Setup)

Once you've done the initial setup, here's how to start the project in the future:

### Terminal 1 — Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver 8080
```

### Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

Then open http://localhost:5173 🎉

---

## 🗂️ API Routes Reference

The Vite dev server proxies these API routes to the Django backend:

| Route Prefix       | Django App | Description                  |
| ------------------ | ---------- | ---------------------------- |
| `/field/*`         | field      | Field CRUD, EE, health score |
| `/finance/*`       | finance    | Costs, revenue, P&L          |
| `/planning/*`      | planning   | Calendar, inventory, labor   |
| `/api/*`           | chat       | AI chatbot                   |
| `/chat/*`          | chat       | Chat endpoints               |
| `/pest`            | field      | Pest image upload            |
| `/health`          | core       | Backend health check         |
| `/password-reset*` | core       | Password reset flow          |

> **Login and Signup** (`/login`, `/signup`) are called directly to `http://localhost:8080` from the frontend (not proxied) to avoid conflicts with React Router pages.

---

## 🧩 Feature Availability (Without External APIs)

The app is designed to work even without external API keys:

| Feature              | Without API Key            | With API Key                |
| -------------------- | -------------------------- | --------------------------- |
| **Weather**          | ✅ Mock data (25°C, Clear) | ✅ Live OpenWeather data    |
| **Chatbot**          | ❌ Needs Gemini API key    | ✅ AI-powered responses     |
| **Pest Detection**   | ⚠️ Fallback analysis       | ✅ Gemini Vision analysis   |
| **Satellite (NDVI)** | ⚠️ Demo/fallback data      | ✅ Real Google Earth Engine |
| **Health Score**     | ✅ Based on available data | ✅ Full CNN + NDVI + LSTM   |
| **Yield Prediction** | ✅ Mock NDVI trends        | ✅ Real satellite-based     |
| **Financial Tools**  | ✅ Fully functional        | ✅ Fully functional         |
| **Planning Tools**   | ✅ Fully functional        | ✅ Fully functional         |

---

## 🐛 Common Issues & Fixes

### Port 8000 Permission Error

```
Error: You don't have permission to access that port.
```

**Fix:** Use port 8080 instead:

```powershell
python manage.py runserver 8080
```

### CORS Errors in Browser Console

**Fix:** Make sure `frontend/.env` has `VITE_API_BASE_URL=` (empty value). The Vite dev proxy handles routing to avoid CORS.

### `psycopg2` Build Error During pip install

**Fix:** This is only needed for PostgreSQL. The project uses SQLite locally, so you can safely ignore this error. Everything will work.

### Earth Engine Authentication Failed

**Fix:** Run `earthengine authenticate` and follow the browser prompts. Make sure you have a registered GEE project and set it in `backend/.env`:

```env
GEE_PROJECT=your-gee-project-id
```

### Redis Not Available Warning

```
Redis not available — falling back to LocMemCache
```

**This is expected.** Redis is optional and only needed in production for caching. The app uses in-memory cache for local development.

### Login Page Shows Django REST Framework Page

**Fix:** Make sure `/login` and `/signup` are **NOT** in the Vite proxy config (`frontend/vite.config.ts`). These routes are handled by React Router.

### Frontend Shows "Network Error"

**Fix:** Make sure the backend is running on port 8080 and the frontend `VITE_API_BASE_URL` is empty in `frontend/.env`.

---

## 📦 Production Build

### Build Frontend for Production

```powershell
cd frontend
npm run build
```

The built files will be in `frontend/dist/public/`.

### Run Backend with Gunicorn (Linux/Mac)

```bash
cd backend
gunicorn KrishiSaarthi.wsgi:application --bind 0.0.0.0:8000
```

### Docker Deployment

```powershell
docker-compose up --build
```

---

## 📞 Support

If you run into any issues:

1. Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) file
2. Ensure both terminals (backend + frontend) are running
3. Check browser console (F12) for error messages
4. Verify your `.env` files have the correct values

---

<div align="center">

**Built with 💚 for farmers worldwide**

_KrishiSaarthi — Empowering agriculture through technology_

</div>
