"""Development settings."""

from .base import *  # noqa

DEBUG = True

WHITENOISE_AUTOREFRESH = True
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

CORS_ALLOW_ALL_ORIGINS = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "notsolong.sqlite3",  # noqa: F405
    }
}
