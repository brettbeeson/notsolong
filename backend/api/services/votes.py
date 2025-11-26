"""Vote-related domain services."""

from __future__ import annotations

from typing import Any, Iterable

from django.db import transaction
from django.db.models import F, Case, IntegerField, QuerySet, Sum, When

from ..models import NoSoLong, Vote


class VoteService:
    """Encapsulate the voting workflow with transactional safety."""

    @staticmethod
    def apply_vote(nosolong: NoSoLong, user: Any, value: int) -> NoSoLong:
        with transaction.atomic():
            deltas = VoteService._apply_vote_deltas(nosolong, user, value)
            if deltas:
                updates = {field: F(field) + delta for field, delta in deltas.items() if delta}
                if updates:
                    NoSoLong.objects.filter(pk=nosolong.pk).update(**updates)
        nosolong.refresh_from_db()
        return nosolong

    @staticmethod
    def _apply_vote_deltas(nosolong: NoSoLong, user: Any, value: int) -> dict[str, int]:
        vote = Vote.objects.select_for_update().filter(quote=nosolong, user=user).first()

        if value == 0:
            if not vote:
                return {}
            deltas = VoteService._delta_for_transition(vote.value, None)
            vote.delete()
            return deltas

        if vote:
            if vote.value == value:
                return {}
            deltas = VoteService._delta_for_transition(vote.value, value)
            vote.value = value
            vote.save(update_fields=["value"])
            return deltas

        Vote.objects.create(quote=nosolong, user=user, value=value)
        return VoteService._delta_for_transition(None, value)

    @staticmethod
    def refresh_vote_metrics(quotes: QuerySet[NoSoLong] | Iterable[int] | None = None) -> None:
        """Recalculate score/upvote/downvote totals for the provided recaps."""

        if quotes is None:
            queryset = NoSoLong.objects.all()
            quote_ids = list(queryset.values_list("pk", flat=True))
        elif isinstance(quotes, QuerySet):
            queryset = quotes
            quote_ids = list(queryset.values_list("pk", flat=True))
        else:
            quote_ids = list(quotes)

        if not quote_ids:
            return

        aggregates = (
            Vote.objects.filter(quote_id__in=quote_ids)
            .values("quote_id")
            .annotate(
                score_total=Sum("value"),
                up_total=Sum(Case(When(value=Vote.UPVOTE, then=1), default=0, output_field=IntegerField())),
                down_total=Sum(Case(When(value=Vote.DOWNVOTE, then=1), default=0, output_field=IntegerField())),
            )
        )

        metrics = {entry["quote_id"]: entry for entry in aggregates}
        for quote_id in quote_ids:
            data = metrics.get(quote_id, {})
            NoSoLong.objects.filter(pk=quote_id).update(
                score=data.get("score_total", 0) or 0,
                upvotes=data.get("up_total", 0) or 0,
                downvotes=data.get("down_total", 0) or 0,
            )

    @staticmethod
    def _delta_for_transition(old_value: int | None, new_value: int | None) -> dict[str, int]:
        score_delta = 0
        up_delta = 0
        down_delta = 0

        if old_value == Vote.UPVOTE:
            score_delta -= 1
            up_delta -= 1
        elif old_value == Vote.DOWNVOTE:
            score_delta += 1
            down_delta -= 1

        if new_value == Vote.UPVOTE:
            score_delta += 1
            up_delta += 1
        elif new_value == Vote.DOWNVOTE:
            score_delta -= 1
            down_delta += 1

        return {k: v for k, v in {"score": score_delta, "upvotes": up_delta, "downvotes": down_delta}.items() if v}
