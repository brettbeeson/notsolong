"""API routing for NotSoLong."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import MeView, RegisterView
from .views import NoSoLongViewSet, TitleViewSet

router = DefaultRouter()
router.register("titles", TitleViewSet, basename="titles")
router.register("nosolongs", NoSoLongViewSet, basename="nosolongs")

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/me/", MeView.as_view(), name="auth_me"),
    path("", include(router.urls)),
]
