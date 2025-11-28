"""Vote-related domain services."""

from __future__ import annotations

from typing import Any, Iterable

from django.db import transaction
from django.db.models import F, Case, IntegerField, QuerySet, Sum, When

from ..models import Recap, Vote


class VoteService:
    """Encapsulate the voting workflow with transactional safety."""

    @staticmethod
    def apply_vote(recap: Recap, user: Any, value: int) -> Recap:
        with transaction.atomic():
            deltas = VoteService._apply_vote_deltas(recap, user, value)
            if deltas:
                updates = {field: F(field) + delta for field, delta in deltas.items() if delta}
                if updates:
                    Recap.objects.filter(pk=recap.pk).update(**updates)
        recap.refresh_from_db()
        return recap

    @staticmethod
    def _apply_vote_deltas(recap: Recap, user: Any, value: int) -> dict[str, int]:
        vote = Vote.objects.select_for_update().filter(recap=recap, user=user).first()

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

        Vote.objects.create(recap=recap, user=user, value=value)
        return VoteService._delta_for_transition(None, value)

    @staticmethod
    def refresh_vote_metrics(recaps: QuerySet[Recap] | Iterable[int] | None = None) -> None:
        """Recalculate score/upvote/downvote totals for the provided recaps."""

        if recaps is None:
            queryset = Recap.objects.all()
            recap_ids = list(queryset.values_list("pk", flat=True))
        elif isinstance(recaps, QuerySet):
            queryset = recaps
            recap_ids = list(queryset.values_list("pk", flat=True))
        else:
            recap_ids = list(recaps)

        if not recap_ids:
            return

        aggregates = (
            Vote.objects.filter(recap_id__in=recap_ids)
            .values("recap_id")
            .annotate(
                score_total=Sum("value"),
                up_total=Sum(Case(When(value=Vote.UPVOTE, then=1), default=0, output_field=IntegerField())),
                down_total=Sum(Case(When(value=Vote.DOWNVOTE, then=1), default=0, output_field=IntegerField())),
            )
        )

        metrics = {entry["recap_id"]: entry for entry in aggregates}
        for recap_id in recap_ids:
            data = metrics.get(recap_id, {})
            Recap.objects.filter(pk=recap_id).update(
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
