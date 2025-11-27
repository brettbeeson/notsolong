"""Serializers for authentication flows."""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "display_name"]
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
    display_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "display_name"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.get("email")
        display_name = validated_data.pop("display_name", "") or ""
        if not display_name and email:
            display_name = email.split("@", 1)[0]
        user = User.objects.create_user(password=password, display_name=display_name, **validated_data)
        return user
