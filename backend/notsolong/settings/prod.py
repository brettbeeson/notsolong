import os

from .base import *  # noqa

DEBUG = False

WHITENOISE_AUTOREFRESH = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
DJANGO_SECURE_SSL_REDIRECT = False
DJANGO_HSTS_SECONDS = 0

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://notsolong.com",
    "https://app.notsolong.com",
    "http://localhost:1111", # for local container
]

# Defaults are required here, as collectstatic runs upon container build...
# ...when the .env.prod is not yet present.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DJANGO_DB_NAME", "notsolong"),
        "USER": os.environ.get("DJANGO_DB_USER", "notsolong"),
        "PASSWORD": os.environ["DJANGO_DB_PASSWORD"],
        "HOST": os.environ["DJANGO_DB_HOST"],
        "PORT": os.environ.get("DJANGO_DB_PORT", "5432"),
    }
}  # noqa: F405

