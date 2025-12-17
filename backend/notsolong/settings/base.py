"""Base Django settings shared across environments."""

import warnings
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent
APPS_DIR = BASE_DIR / "notsolong"

warnings.filterwarnings(
    "ignore",
    message=r".*is deprecated.*",
    category=UserWarning,
    module=r"^dj_rest_auth.*$",
)

#
# We do not *read* the .env file automatically here, but the current environment.
# We rely on the environment being set up externally,
#
env = environ.Env()

DJANGO_LOGGING = env.bool("DJANGO_LOGGING", default=False)

# FRONTEND_DIST_DIR = Path(env("FRONTEND_DIST_DIR", default=BASE_DIR / "frontend" / "dist"))
FRONTEND_DIST_DIR = Path("/app/frontend_dist")

SITE_ID = 1
SITE_URL = env("DJANGO_SITE_URL", default="http://localhost:8000")

SECRET_KEY = env("DJANGO_SECRET_KEY")

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

TURNSTILE_SECRET_KEY = env("TURNSTILE_SECRET_KEY", default="")
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.sites",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # auth stack:
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    # auth stack end
    "accounts",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "notsolong.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [APPS_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "notsolong.wsgi.application"

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-au"
TIME_ZONE = "Australia/Brisbane"
USE_I18N = False
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS: list[Path] = []
project_static = APPS_DIR / "static"
if project_static.exists():
    STATICFILES_DIRS.append(project_static)
if FRONTEND_DIST_DIR.exists():
    STATICFILES_DIRS.append(FRONTEND_DIST_DIR)

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
WHITENOISE_MAX_AGE = 60 * 60 * 24 * 30
WHITENOISE_ROOT = BASE_DIR / "public"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=365),
    "ROTATE_REFRESH_TOKENS": False,
    "USER_ID_FIELD": "email",
}

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "username"]
ACCOUNT_USER_MODEL_USERNAME_FIELD = "username"
# options are "mandatory", "optional", "none"
ACCOUNT_EMAIL_VERIFICATION = "none"


REST_AUTH = {
    "USE_JWT": True,
    # return access/refresh tokens in JSON response body (not HttpOnly cookies)
    "JWT_AUTH_HTTPONLY": False,
    "TOKEN_MODEL": None,
    "USER_DETAILS_SERIALIZER": "accounts.serializers.UserSerializer",
    "LOGIN_SERIALIZER": "accounts.serializers.TurnstileLoginSerializer",
    "REGISTER_SERIALIZER": "accounts.serializers.AllauthRegisterSerializer",
}
LOGIN_REDIRECT_URL = "/"

SYSTEM_LOG_LEVEL = "INFO" if DJANGO_LOGGING else "WARNING"
APP_LOG_LEVEL = "DEBUG" if DJANGO_LOGGING else "INFO"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "(levelname) {name} {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": SYSTEM_LOG_LEVEL,
    },
    "loggers": {
        #
        # App loggers handle their output.
        # If we don't do this and use propagate, setting level=DEBUG here
        # will not output if root logger is at higher level.
        #
        "notsolong": {
            "level": APP_LOG_LEVEL,
            "handlers": ["console"],
            "propagate": False,
        },
        "accounts": {
            "level": APP_LOG_LEVEL,
            "handlers": ["console"],
            "propagate": False,
        },
        "api": {
            "level": APP_LOG_LEVEL,
            "handlers": ["console"],
            "propagate": False,
        },
        #
        # system loggers respect global logging level and propagate to root logger
        #
        "django.request": {
            "level": SYSTEM_LOG_LEVEL,
            "propagate": True,
        },
        "django.db.backends": {
            "level": SYSTEM_LOG_LEVEL, # DEBUG level to log all SQL queries
            "propagate": True,
        },
    },
}
