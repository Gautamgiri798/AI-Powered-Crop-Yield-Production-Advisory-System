#!/usr/bin/env bash
# Render Build Script for KrishiSaarthi Backend
# This script runs during every deploy on Render

set -o errexit  # exit on error

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements-production.txt

echo "=== Running database migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Build complete ==="
