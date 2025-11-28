"""Serializers for the NotSoLong API."""

from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Recap, Title


class TitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Title
        fields = ["id", "name", "category", "author", "created_at"]
        read_only_fields = ["id", "created_at"]


class RecapSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    title = TitleSerializer(read_only=True)
    current_user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Recap
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


class RecapCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recap
        fields = ["title", "text"]

    def validate(self, attrs):
        request = self.context.get("request")
        title = attrs.get("title")
        if request and request.user.is_authenticated and title:
            if Recap.objects.filter(title=title, user=request.user).exists():
                raise serializers.ValidationError("You already have a recap for this title.")
        return attrs


class RecapUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recap
        fields = ["text"]


class VoteSerializer(serializers.Serializer):
    value = serializers.IntegerField(min_value=-1, max_value=1)


class TitleSummarySerializer(serializers.Serializer):
    title = TitleSerializer()
    top_recap = RecapSerializer(allow_null=True)
    other_recaps = RecapSerializer(many=True)
