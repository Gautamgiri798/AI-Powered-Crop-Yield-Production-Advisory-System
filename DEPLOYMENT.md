# 🚀 Deployment Guide — KrishiSaarthi (AgriSmart)

> Deploy your project live on the internet using **Render** (free tier) or **Docker**.

---

## 📋 Table of Contents

1. [Option A: Deploy on Render (Recommended — Free)](#option-a-deploy-on-render-free)
2. [Option B: Deploy with Docker Compose](#option-b-deploy-with-docker-compose)
3. [Post-Deployment Configuration](#post-deployment-configuration)
4. [Environment Variables Reference](#environment-variables-reference)

---

## Option A: Deploy on Render (Free)

Render provides free hosting for web services, static sites, and PostgreSQL databases — perfect for this project.

### Prerequisites

- A [Render](https://render.com) account (sign up free)
- Your project pushed to a **GitHub** or **GitLab** repository

### Step 1: Push Code to GitHub

```powershell
cd "c:\Users\gauta\OneDrive\Desktop\Capstone Project\Crop Yeild Prediction\KrishiSaarthi"
git add -A
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy Backend (Django API)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting            | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Name**           | `krishisaarthi-backend`                                                                  |
| **Root Directory** | `backend`                                                                                |
| **Runtime**        | `Python 3`                                                                               |
| **Build Command**  | `./build.sh`                                                                             |
| **Start Command**  | `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 KrishiSaarthi.wsgi:application` |
| **Plan**           | `Free`                                                                                   |

4. Add these **Environment Variables**:

| Key                    | Value                                             |
| ---------------------- | ------------------------------------------------- |
| `PYTHON_VERSION`       | `3.11.7`                                          |
| `DJANGO_SECRET_KEY`    | _(click "Generate" to auto-generate)_             |
| `DEBUG`                | `False`                                           |
| `ALLOWED_HOSTS`        | `.onrender.com`                                   |
| `DATABASE_URL`         | _(from Step 3 below — add after creating DB)_     |
| `GEMINI_API_KEY`       | _(your Gemini API key)_                           |
| `OPENWEATHER_API_KEY`  | _(your OpenWeather key, or leave empty for mock)_ |
| `CORS_ALLOWED_ORIGINS` | _(your frontend URL — add after Step 4)_          |
| `CSRF_TRUSTED_ORIGINS` | _(your frontend URL — add after Step 4)_          |

5. Click **Create Web Service**

### Step 3: Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:

| Setting      | Value              |
| ------------ | ------------------ |
| **Name**     | `krishisaarthi-db` |
| **Database** | `krishisaarthi`    |
| **User**     | `krishiuser`       |
| **Plan**     | `Free`             |

3. Once created, copy the **Internal Database URL**
4. Go back to your **backend service** → **Environment** → set `DATABASE_URL` to the copied URL

### Step 4: Deploy Frontend (React Static Site)

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect the same GitHub repo
3. Configure:

| Setting               | Value                          |
| --------------------- | ------------------------------ |
| **Name**              | `krishisaarthi-frontend`       |
| **Root Directory**    | `frontend`                     |
| **Build Command**     | `npm install && npm run build` |
| **Publish Directory** | `dist/public`                  |

4. Add **Environment Variable**:

| Key                 | Value                                                             |
| ------------------- | ----------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://krishisaarthi-backend.onrender.com` _(your backend URL)_ |

5. Click **Create Static Site**
6. Add a **Rewrite Rule**: Source `/*` → Destination `/index.html` (for SPA routing)

### Step 5: Connect Frontend ↔ Backend

After both services are deployed, you'll have URLs like:

- Backend: `https://krishisaarthi-backend.onrender.com`
- Frontend: `https://krishisaarthi-frontend.onrender.com`

1. Go to **Backend** → **Environment** and update:
   - `CORS_ALLOWED_ORIGINS` = `https://krishisaarthi-frontend.onrender.com`
   - `CSRF_TRUSTED_ORIGINS` = `https://krishisaarthi-frontend.onrender.com`

2. Go to **Frontend** → **Environment** and verify:
   - `VITE_API_BASE_URL` = `https://krishisaarthi-backend.onrender.com`

3. Trigger a **manual deploy** on both services to apply changes.

### Step 6: Update AuthContext for Production

The frontend `AuthContext.tsx` has a hardcoded `AUTH_API_URL` for login/signup. For production, this needs to point to your deployed backend:

Open `frontend/client/src/context/AuthContext.tsx` and update:

```typescript
// Change this line:
const AUTH_API_URL = "http://localhost:8080";

// To use the env variable:
const AUTH_API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
```

Then push and redeploy the frontend.

---

### 🎉 Your App is Live!

Visit your frontend URL (e.g., `https://krishisaarthi-frontend.onrender.com`) to see your deployed app!

> **Note:** Render free tier services spin down after 15 minutes of inactivity and take ~30 seconds to wake up on the next request. This is normal.

---

## Option B: Deploy with Docker Compose

For self-hosted deployment on any server (VPS, EC2, DigitalOcean, etc.).

### Prerequisites

- A Linux server with Docker and Docker Compose installed
- Domain name (optional — can use server IP)

### Step 1: Clone and Configure

```bash
# On your server
git clone https://github.com/yourusername/KrishiSaarthi.git
cd KrishiSaarthi
```

### Step 2: Create Backend Environment File

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in your actual values:

```env
DJANGO_SECRET_KEY=your-very-secure-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-server-ip
GEMINI_API_KEY=your-gemini-api-key
OPENWEATHER_API_KEY=your-openweather-api-key
CORS_ALLOWED_ORIGINS=https://your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com
DATABASE_URL=postgres://krishiuser:changeme@db:5432/krishisaarthi
```

### Step 3: Build and Start Containers

```bash
# Build all images
docker-compose build

# Start all services in detached mode
docker-compose up -d
```

### Step 4: Run Database Migration

```bash
docker-compose exec backend python manage.py migrate --noinput
docker-compose exec backend python manage.py createsuperuser
```

### Step 5: Verify

```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test health endpoint
curl http://localhost:8000/health
```

### Access the App

| Service      | URL                          |
| ------------ | ---------------------------- |
| **Frontend** | `http://your-server-ip:80`   |
| **Backend**  | `http://your-server-ip:8000` |
| **Database** | `localhost:5432` (internal)  |

---

## Post-Deployment Configuration

### Setting Up a Custom Domain (Render)

1. Go to your Render service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `krishisaarthi.com`)
3. Add the DNS records Render provides to your domain registrar
4. Render automatically provisions SSL certificates

### Setting Up a Custom Domain (Docker)

Use the nginx config at `nginx/nginx.conf`. Update:

- `server_name` to your domain
- SSL certificate paths

### Database Backups (Render)

Render PostgreSQL free tier includes:

- 90-day data retention
- Manual backups from the dashboard

---

## Environment Variables Reference

### Backend Environment Variables

| Variable               | Required       | Description                                      |
| ---------------------- | -------------- | ------------------------------------------------ |
| `DJANGO_SECRET_KEY`    | ✅ Yes         | Django secret key (auto-generate for production) |
| `DEBUG`                | ✅ Yes         | Set to `False` in production                     |
| `ALLOWED_HOSTS`        | ✅ Yes         | Comma-separated hostnames                        |
| `DATABASE_URL`         | ✅ Yes         | PostgreSQL connection string                     |
| `CORS_ALLOWED_ORIGINS` | ✅ Yes         | Frontend URL(s) — comma-separated                |
| `CSRF_TRUSTED_ORIGINS` | ✅ Yes         | Frontend URL(s) — comma-separated                |
| `GEMINI_API_KEY`       | ⚡ Recommended | For AI chatbot and pest detection                |
| `OPENWEATHER_API_KEY`  | ❌ Optional    | For live weather (mock data used if absent)      |
| `GEE_PROJECT`          | ❌ Optional    | Google Earth Engine project ID                   |
| `REDIS_URL`            | ❌ Optional    | Redis for caching (uses memory cache if absent)  |

### Frontend Environment Variables

| Variable            | Required | Description                  |
| ------------------- | -------- | ---------------------------- |
| `VITE_API_BASE_URL` | ✅ Yes   | Full URL of deployed backend |

---

## 🔒 Security Checklist for Production

- [x] `DEBUG=False`
- [x] `DJANGO_SECRET_KEY` is a strong, unique value
- [x] `ALLOWED_HOSTS` is restricted to your domain
- [x] `CORS_ALLOWED_ORIGINS` is restricted to your frontend URL
- [x] `CSRF_TRUSTED_ORIGINS` matches your frontend URL
- [x] HTTPS enabled (auto on Render, manual on Docker)
- [ ] Change default admin password
- [ ] Set up monitoring / error tracking (Sentry recommended)

---

<div align="center">

**🌾 KrishiSaarthi — Empowering farmers through technology 🌾**

</div>
