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

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        }
    },
    "formatters": {
        "verbose": {
            "format": "%(levelname)s %(asctime)s %(name)s %(message)s",
        }
    },
    "loggers": {
        "allauth": {"handlers": ["console"], "level": "DEBUG"},
        "dj_rest_auth": {"handlers": ["console"], "level": "DEBUG"},
        "accounts": {"handlers": ["console"], "level": "DEBUG"},
        "django.request": {"handlers": ["console"], "level": "DEBUG"},
        "notsolong": {"handlers": ["console"], "level": "DEBUG"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}
