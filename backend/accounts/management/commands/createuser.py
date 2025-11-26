import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update a regular user via environment variables."

    def add_arguments(self, parser):
        parser.add_argument("--email", help="Email for the user")
        parser.add_argument("--password", help="Password for the user")
        parser.add_argument("--display-name", help="Display name")

    def handle(self, *args, **options):
        email = options["email"] or os.environ.get("DJANGO_USER_EMAIL")
        password = options["password"] or os.environ.get("DJANGO_USER_PASSWORD")
        display_name = options["display_name"] or os.environ.get("DJANGO_USER_DISPLAY_NAME")

        if not email:
            raise CommandError("Email must be provided via --email or DJANGO_USER_EMAIL.")
        if not password:
            raise CommandError("Password must be provided via --password or DJANGO_USER_PASSWORD.")
        if not display_name:
            display_name = email.split("@", 1)[0]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "display_name": display_name,
            },
        )

        user.display_name = display_name
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} user {email}"))
