"""API routing for NotSoLong."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import MeView, RegisterView, TurnstileTokenObtainPairView
from .views import RecapViewSet, TitleViewSet

router = DefaultRouter()
router.register("titles", TitleViewSet, basename="titles")
router.register("recaps", RecapViewSet, basename="recaps")

urlpatterns = [
    path("auth/token/", TurnstileTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/me/", MeView.as_view(), name="auth_me"),
    path("", include(router.urls)),
]
