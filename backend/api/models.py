from django.conf import settings
from django.db import models


class TitleCategory(models.TextChoices):
    BOOK = "book", "Book"
    MOVIE = "movie", "Movie"
    TVSERIES = "tvseries", "TV Series"
    TVSHOW = "tvshow", "TV Show"
    PODCAST = "podcast", "Podcast"
    SPEECH = "speech", "Speech"
    OTHER = "other", "Other"


class Title(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=TitleCategory.choices)
    author = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="titles",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class NoSoLong(models.Model):
    title = models.ForeignKey(Title, related_name="nosolongs", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="nosolongs", on_delete=models.CASCADE)
    text = models.TextField()
    score = models.IntegerField(default=0)
    upvotes = models.PositiveIntegerField(default=0)
    downvotes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-score", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["title", "user"], name="unique_title_user_nosolong"),
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.user}: {self.text[:50]}"


class Vote(models.Model):
    UPVOTE = 1
    DOWNVOTE = -1

    quote = models.ForeignKey(NoSoLong, related_name="votes", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="votes", on_delete=models.CASCADE)
    value = models.SmallIntegerField(choices=((DOWNVOTE, "Downvote"), (UPVOTE, "Upvote")))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["quote", "user"], name="unique_quote_vote")]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.user} -> {self.quote_id} ({self.value})"
