from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("email", "display_name")


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ("email", "display_name", "is_active", "is_staff")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for email-based users."""

    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    list_display = ("email", "display_name", "is_active", "is_staff")
    ordering = ("email",)
    search_fields = ("email", "display_name")
    fieldsets = (
        (None, {"fields": ("email", "password", "display_name")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "display_name", "password1", "password2", "is_staff", "is_superuser", "is_active"),
            },
        ),
    )
