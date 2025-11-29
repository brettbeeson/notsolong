import os

from .base import *  # noqa

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
]

# Defaults are required here, as collectstatic runs upon container build...
# ...when the .env.prod is not yet present.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "notsolong"),
        "USER": os.environ.get("POSTGRES_USER", "notsolonguser"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "notsolongpassword"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}  # noqa: F405
