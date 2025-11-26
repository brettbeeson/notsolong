from django.contrib import admin

from .models import NoSoLong, Title, Vote


@admin.register(Title)
class TitleAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "author", "created_at")
    list_filter = ("category",)
    search_fields = ("name", "author")


@admin.register(NoSoLong)
class NoSoLongAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "score", "created_at")
    list_filter = ("title__category",)
    search_fields = ("text", "title__name", "user__username")


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ("quote", "user", "value", "created_at")
    list_filter = ("value",)
