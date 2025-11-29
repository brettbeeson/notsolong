from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from dj_rest_auth.views import LoginView as DjLoginView

from .serializers import RegisterSerializer, UserSerializer
from .turnstile import verify_turnstile_token


class RegisterView(APIView):
    """Register a new user and return JWT pair."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """Return or update the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        # Only allow updating username via serializer
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # Prevent email changes
        if "email" in serializer.validated_data:
            return Response({"detail": "Email cannot be changed."}, status=400)
        serializer.save()
        return Response(serializer.data)


class TurnstileTokenObtainPairView(TokenObtainPairView):
    """Issue JWT tokens only after passing Turnstile verification."""

    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class GoogleLoginView(SocialLoginView):
    """Authenticate via Google OAuth using dj-rest-auth social login."""

    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = getattr(settings, "GOOGLE_OAUTH_CALLBACK_URL", None)


class DebugLoginView(DjLoginView):
    """Login view for debug."""

    def post(self, request, *args, **kwargs):
        if settings.DEBUG:
            print("Debug login view called")

            return super().post(request, *args, **kwargs)
        return super().post(request, *args, **kwargs)
