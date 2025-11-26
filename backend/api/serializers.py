"""Serializers for the NotSoLong API."""

from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import NoSoLong, Title


class TitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Title
        fields = ["id", "name", "category", "author", "created_at"]
        read_only_fields = ["id", "created_at"]


class NoSoLongSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    title = TitleSerializer(read_only=True)
    current_user_vote = serializers.SerializerMethodField()

    class Meta:
        model = NoSoLong
        fields = [
            "id",
            "title",
            "user",
            "text",
            "score",
            "upvotes",
            "downvotes",
            "current_user_vote",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "score",
            "upvotes",
            "downvotes",
            "current_user_vote",
            "created_at",
            "updated_at",
            "title",
            "user",
        ]

    def get_current_user_vote(self, obj):
        value = getattr(obj, "current_user_vote", None)
        if value is None:
            return None
        try:
            return int(value)
        except (TypeError, ValueError):  # pragma: no cover - defensive
            return None


class NoSoLongCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoSoLong
        fields = ["title", "text"]

    def validate(self, attrs):
        request = self.context.get("request")
        title = attrs.get("title")
        if request and request.user.is_authenticated and title:
            if NoSoLong.objects.filter(title=title, user=request.user).exists():
                raise serializers.ValidationError("You already have a recap for this title.")
        return attrs


class NoSoLongUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoSoLong
        fields = ["text"]


class VoteSerializer(serializers.Serializer):
    value = serializers.IntegerField(min_value=-1, max_value=1)


class TitleSummarySerializer(serializers.Serializer):
    title = TitleSerializer()
    top_nosolong = NoSoLongSerializer(allow_null=True)
    other_nosolongs = NoSoLongSerializer(many=True)
