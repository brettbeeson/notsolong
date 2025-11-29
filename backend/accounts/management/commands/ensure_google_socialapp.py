from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from allauth.socialaccount.models import SocialApp


class Command(BaseCommand):
    help = "Ensure a Google SocialApp exists using GOOGLE_CLIENT_ID/SECRET env settings."

    def add_arguments(self, parser):
        parser.add_argument("--site-id", type=int, help="Override SITE_ID target")
        parser.add_argument("--client-id", help="Override GOOGLE_CLIENT_ID")
        parser.add_argument("--client-secret", help="Override GOOGLE_CLIENT_SECRET")

    def handle(self, *args, **options):
        client_id = options["client_id"] or getattr(settings, "GOOGLE_CLIENT_ID", "")
        client_secret = options["client_secret"] or getattr(settings, "GOOGLE_CLIENT_SECRET", "")
        if not client_id:
            raise CommandError("GOOGLE_CLIENT_ID is not configured.")
        if not client_secret:
            raise CommandError("GOOGLE_CLIENT_SECRET is not configured.")

        site_id = options["site_id"] or getattr(settings, "SITE_ID", None)
        if not site_id:
            raise CommandError("SITE_ID is not configured; provide --site-id explicitly.")

        try:
            site = Site.objects.get(pk=site_id)
        except Site.DoesNotExist as exc:  # pragma: no cover - should not happen in prod
            raise CommandError(f"Site {site_id} does not exist") from exc

        app, created = SocialApp.objects.update_or_create(
            provider="google",
            defaults={
                "name": "Google",
                "client_id": client_id.strip(),
                "secret": client_secret.strip(),
            },
        )
        app.sites.set([site])
        app.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} Google SocialApp for site {site.domain} (ID {site.pk})"))
