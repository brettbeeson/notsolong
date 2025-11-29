"""Serializers for authentication flows."""

from dj_rest_auth.registration.serializers import (
    RegisterSerializer as DjRestAuthRegisterSerializer,
)
from dj_rest_auth.serializers import LoginSerializer as DjRestAuthLoginSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .turnstile import verify_turnstile_token

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "username"]
        read_only_fields = ["email"]


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="An account with this email already exists.",
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "username"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.get("email")
        username = (validated_data.pop("username", "") or "").strip()
        if not username and email:
            username = email.split("@", 1)[0]
        user = User.objects.create_user(password=password, username=username, **validated_data)
        return user


class AllauthRegisterSerializer(DjRestAuthRegisterSerializer):
    """Registration serializer used by dj-rest-auth to support email-only signup."""

    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    turnstile_token = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):  # pragma: no cover - exercised via integration tests
        token = attrs.pop("turnstile_token", None)
        if not verify_turnstile_token(token):
            raise serializers.ValidationError({"detail": "Turnstile validation failed."})
        return super().validate(attrs)

    def _preferred_username(self, data):
        preferred = (self.validated_data.get("username") or "").strip()
        if not preferred:
            email = data.get("email") or ""
            preferred = email.split("@", 1)[0] if email else ""
        return preferred

    def get_cleaned_data(self):  # pragma: no cover - adapter handles validation
        data = super().get_cleaned_data()
        preferred = self._preferred_username(data)
        data["username"] = preferred or data.get("username") or data.get("email")
        return data

    def save(self, request):  # pragma: no cover - exercised via integration tests
        user = super().save(request)
        preferred = (self.cleaned_data.get("username") or "").strip()
        if preferred and getattr(user, "username", "") != preferred:
            user.username = preferred
            user.save(update_fields=["username"])
        return user


class TurnstileLoginSerializer(DjRestAuthLoginSerializer):
    """Login serializer that enforces Cloudflare Turnstile when configured."""

    turnstile_token = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):  # pragma: no cover - exercised via integration tests
        token = attrs.pop("turnstile_token", None)
        if not verify_turnstile_token(token):
            raise serializers.ValidationError({"detail": "Turnstile validation failed."})
        return super().validate(attrs)
