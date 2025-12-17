import os

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from api.models import Recap, Title, TitleCategory

pytestmark = pytest.mark.django_db

#
# Ensure .env.dev is used for tests
#
assert os.getenv("DJANGO_SETTINGS_MODULE") == "notsolong.settings.dev", "Tests must use dev settings with test database. Be sure to Reload the vscode window."  # noqa: E501

@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()

@pytest.fixture()
def user_factory():
    def factory(**overrides):
        counter = factory.counter
        factory.counter += 1
        defaults = {
            "email": f"user{counter}@example.com",
            "password": "password123",
            "username": f"User {counter}",
        }
        defaults.update(overrides)
        return User.objects.create_user(**defaults)

    factory.counter = 0
    return factory


@pytest.fixture()
def title_with_recap(user_factory):
    author = user_factory(email="tester@example.com", username="Tester")
    title = Title.objects.create(
        name="The Matrix",
        category=TitleCategory.MOVIE,
        author="Wachowski",
        created_by=author,
    )
    Recap.objects.create(title=title, user=author, text="There is no spoon.")
    return title, author


def test_random_endpoint_returns_bundle(api_client, title_with_recap):
    response = api_client.get(reverse("titles-random"))
    assert response.status_code == status.HTTP_200_OK
    assert "title" in response.data
    assert "top_recap" in response.data
    assert "other_recaps" in response.data


def test_count_endpoint_returns_total(api_client, title_with_recap):
    response = api_client.get(reverse("titles-count"))
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1


def test_count_endpoint_respects_category_filter(api_client, title_with_recap, user_factory):
    author = title_with_recap[1]
    Title.objects.create(
        name="Inception",
        category=TitleCategory.MOVIE,
        author="Christopher Nolan",
        created_by=author,
    )
    Title.objects.create(
        name="Brave New World",
        category=TitleCategory.BOOK,
        author="Aldous Huxley",
        created_by=author,
    )
    response = api_client.get(reverse("titles-count"), {"category": TitleCategory.MOVIE})
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 2


@pytest.fixture()
def recap_for_voting(user_factory):
    voter = user_factory(email="voter@example.com", username="Voter")
    author = user_factory(email="author@example.com", username="Author")
    title = Title.objects.create(
        name="1984",
        category=TitleCategory.BOOK,
        author="George Orwell",
        created_by=author,
    )
    recap = Recap.objects.create(
        title=title,
        user=author,
        text="Big Brother is watching you.",
    )
    return recap, voter


def test_vote_cycle_updates_score(api_client, recap_for_voting):
    recap, voter = recap_for_voting
    api_client.force_authenticate(user=voter)
    url = reverse("recaps-vote", args=[recap.pk])

    upvote = api_client.post(url, {"value": 1}, format="json")
    assert upvote.status_code == status.HTTP_200_OK
    recap.refresh_from_db()
    assert recap.score == 1

    remove = api_client.post(url, {"value": 0}, format="json")
    assert remove.status_code == status.HTTP_200_OK
    recap.refresh_from_db()
    assert recap.score == 0


@pytest.fixture()
def recap_creation_context(user_factory):
    user = user_factory(email="authorseed@example.com", username="Seed Author")
    title = Title.objects.create(
        name="Dune",
        category=TitleCategory.BOOK,
        author="Frank Herbert",
        created_by=user,
    )
    return user, title


def test_invalid_title_returns_400(api_client, recap_creation_context):
    user, title = recap_creation_context
    api_client.force_authenticate(user=user)
    response = api_client.post(
        reverse("recaps-list"),
        {"title": title.pk + 100, "text": "Fear is the mind-killer."},
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "title" in response.data


def test_me_endpoint_returns_user(api_client, user_factory):
    user = user_factory(email="authuser@example.com", username="Auth User")
    api_client.force_authenticate(user=user)
    response = api_client.get(reverse("auth_me"))
    assert response.status_code == status.HTTP_200_OK
    assert response.data["email"] == "authuser@example.com"
