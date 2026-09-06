#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files for WhiteNoise..."
python manage.py collectstatic --noinput --clear

echo "Loading initial data (only if the database is still empty)..."
python manage.py load_initial_data || true

echo "Creating/repairing default superuser..."
python manage.py create_defaultsuperuser || true

echo "Starting Gunicorn..."
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60
