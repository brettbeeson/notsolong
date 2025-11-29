import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update a regular user via environment variables."

    def add_arguments(self, parser):
        parser.add_argument("--email", help="Email for the user")
        parser.add_argument("--password", help="Password for the user")
        parser.add_argument("--username", help="Username (or derive from DJANGO_USER_USERNAME)")

    def handle(self, *args, **options):
        email = options["email"] or os.environ.get("DJANGO_USER_EMAIL")
        password = options["password"] or os.environ.get("DJANGO_USER_PASSWORD")
        username = options["username"] or os.environ.get("DJANGO_USER_USERNAME")

        if not email:
            raise CommandError("Email must be provided via --email or DJANGO_USER_EMAIL.")
        if not password:
            raise CommandError("Password must be provided via --password or DJANGO_USER_PASSWORD.")
        if not username:
            username = email.split("@", 1)[0]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
            },
        )

        user.username = username
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} user {email}"))
