from django.contrib import admin

from .models import Recap, Title, Vote


@admin.register(Title)
class TitleAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "author", "created_at")
    list_filter = ("category",)
    search_fields = ("name", "author")


@admin.register(Recap)
class RecapAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "score", "created_at")
    list_filter = ("title__category",)
    search_fields = ("text", "title__name", "user__username")


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ("recap", "user", "value", "created_at")
    list_filter = ("value",)
