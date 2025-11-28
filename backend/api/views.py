from typing import Any, Dict

from django.db import IntegrityError
from django.db.models import OuterRef, QuerySet, Subquery
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Recap, Title, TitleCategory, Vote
from .serializers import (
    RecapCreateSerializer,
    RecapUpdateSerializer,
    RecapSerializer,
    TitleSerializer,
    TitleSummarySerializer,
    VoteSerializer,
)
from .services.votes import VoteService

import logging

logger = logging.getLogger(__name__)


class TitleViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Manage Titles and provide custom random/summary views."""

    queryset = Title.objects.prefetch_related("recaps__user", "recaps__title")
    serializer_class = TitleSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="random", permission_classes=[AllowAny])
    def random(self, request):
        """Return a random title bundle, optionally filtered by category and excluding given IDs."""

        category = request.query_params.get("category")
        exclude = request.query_params.getlist("exclude")
        # If exclude is a single comma-separated string, split it
        if len(exclude) == 1 and "," in exclude[0]:
            exclude = exclude[0].split(",")
        # Convert to integers, ignore invalids
        exclude_ids = []
        for val in exclude:
            try:
                exclude_ids.append(int(val))
            except (TypeError, ValueError):
                continue
        queryset = self._filter_by_category(self.get_queryset(), category)
        if exclude_ids:
            queryset = queryset.exclude(pk__in=exclude_ids)
        title = queryset.order_by("?").first()
        if not title:
            raise NotFound("No titles available for the requested filter.")
        return Response(self._build_summary(title))

    @action(detail=True, methods=["get"], url_path="summary", permission_classes=[AllowAny])
    def summary(self, request, pk=None):
        """Return the summary payload for a specific title."""

        title = self.get_object()
        return Response(self._build_summary(title))

    def _filter_by_category(self, queryset: QuerySet[Title], category: str | None) -> QuerySet[Title]:
        if category:
            if category not in TitleCategory.values:
                raise ValidationError({"category": "Invalid category."})
            return queryset.filter(category=category)
        return queryset

    def _build_summary(self, title: Title) -> dict[str, Any]:
        recaps = self._annotate_with_vote(title.recaps.select_related("user", "title"))
        top = recaps.order_by("-score", "-created_at").first()
        others = recaps.exclude(pk=getattr(top, "pk", None)).order_by("?")[:3] if top else recaps.order_by("?")[:3]
        serializer = TitleSummarySerializer(
            {
                "title": title,
                "top_recap": top,
                "other_recaps": list(others),
            },
            context={"request": self.request},
        )
        return serializer.data

    def _annotate_with_vote(self, queryset: QuerySet[Recap]) -> QuerySet[Recap]:
        user = getattr(self.request, "user", None)
        if user and user.is_authenticated:
            vote_subquery = Vote.objects.filter(recap=OuterRef("pk"), user=user).values("value")[:1]
            return queryset.annotate(current_user_vote=Subquery(vote_subquery))
        return queryset


class RecapViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Create Recap quotes and manage votes."""

    queryset = Recap.objects.select_related("title", "user")
    serializer_class = RecapSerializer

    def get_permissions(self):
        if self.action in {"create", "vote", "update", "partial_update", "destroy"}:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, "user", None)
        if user and user.is_authenticated:
            vote_subquery = Vote.objects.filter(recap=OuterRef("pk"), user=user).values("value")[:1]
            queryset = queryset.annotate(current_user_vote=Subquery(vote_subquery))
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return RecapCreateSerializer
        if self.action in {"update", "partial_update"}:
            return RecapUpdateSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        logger.debug(f"Creating Recap with data: {request.data}")
        serializer.is_valid(raise_exception=True)
        try:
            recap = serializer.save(user=request.user)
        except IntegrityError as exc:
            message = str(exc)
            if "unique_title_user_nosolong" in message or "unique_title_user_recap" in message:
                raise ValidationError({"title": "You already have a recap for this title."}) from exc
            raise ValidationError({"title": "Invalid or missing title."}) from exc
        output = RecapSerializer(recap, context={"request": request})
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.pk:
            raise PermissionDenied("You can only edit your own recap.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.pk:
            raise PermissionDenied("You can only delete your own recap.")
        instance.delete()

    @action(detail=True, methods=["post"], url_path="vote", permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        recap = self.get_object()
        serializer = VoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        value = serializer.validated_data["value"]
        VoteService.apply_vote(recap, request.user, value)
        updated = self.get_queryset().get(pk=recap.pk)
        return Response(RecapSerializer(updated, context={"request": request}).data, status=status.HTTP_200_OK)
