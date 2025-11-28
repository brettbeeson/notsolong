from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from api.models import Recap, Title, TitleCategory


class TitleEndpointsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="tester@example.com",
            password="password123",
            display_name="Tester",
        )
        self.title = Title.objects.create(
            name="The Matrix",
            category=TitleCategory.MOVIE,
            author="Wachowski",
            created_by=self.user,
        )
        Recap.objects.create(title=self.title, user=self.user, text="There is no spoon.")

    def test_random_endpoint_returns_bundle(self):
        response = self.client.get(reverse("titles-random"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("title", response.data)
        self.assertIn("top_recap", response.data)
        self.assertIn("other_recaps", response.data)


class VoteEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="voter@example.com",
            password="password123",
            display_name="Voter",
        )
        self.author = User.objects.create_user(
            email="author@example.com",
            password="password123",
            display_name="Author",
        )
        self.title = Title.objects.create(
            name="1984",
            category=TitleCategory.BOOK,
            author="George Orwell",
            created_by=self.author,
        )
        self.recap = Recap.objects.create(
            title=self.title,
            user=self.author,
            text="Big Brother is watching you.",
        )

    def test_vote_cycle_updates_score(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("recaps-vote", args=[self.recap.pk])

        upvote = self.client.post(url, {"value": 1}, format="json")
        self.assertEqual(upvote.status_code, status.HTTP_200_OK)
        self.recap.refresh_from_db()
        self.assertEqual(self.recap.score, 1)

        remove = self.client.post(url, {"value": 0}, format="json")
        self.assertEqual(remove.status_code, status.HTTP_200_OK)
        self.recap.refresh_from_db()
        self.assertEqual(self.recap.score, 0)


class RecapCreateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="authorseed@example.com",
            password="password123",
            display_name="Seed Author",
        )
        self.title = Title.objects.create(
            name="Dune",
            category=TitleCategory.BOOK,
            author="Frank Herbert",
            created_by=self.user,
        )

    def test_invalid_title_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("recaps-list"),
            {"title": self.title.pk + 100, "text": "Fear is the mind-killer."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)


class AuthEndpointsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="authuser@example.com",
            password="password123",
            display_name="Auth User",
        )

    def test_me_endpoint_returns_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("auth_me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "authuser@example.com")
