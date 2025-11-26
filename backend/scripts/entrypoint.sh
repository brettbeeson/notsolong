#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn notsolong.wsgi:application --bind "0.0.0.0:${INTERNAL_PORT}" --workers "${GUNICORN_WORKERS:-3}" --timeout "${GUNICORN_TIMEOUT:-30}"
