"""Development settings."""

from .base import *  # noqa

DEBUG = True
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"



DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "notsolong.sqlite3",  # noqa: F405
    }
}
