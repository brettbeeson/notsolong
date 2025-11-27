from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer, UserSerializer
from .turnstile import verify_turnstile_token


class RegisterView(APIView):
    """Register a new user and return JWT pair."""

    permission_classes = [AllowAny]

    def post(self, request):
        if not verify_turnstile_token(request.data.get("turnstile_token")):
            return Response({"detail": "Turnstile validation failed."}, status=status.HTTP_400_BAD_REQUEST)
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
        # Only allow updating display_name
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
        if not verify_turnstile_token(request.data.get("turnstile_token")):
            return Response({"detail": "Turnstile validation failed."}, status=status.HTTP_400_BAD_REQUEST)
        return super().post(request, *args, **kwargs)
