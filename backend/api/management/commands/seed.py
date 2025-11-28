import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Recap, Title, TitleCategory, Vote
from api.services.votes import VoteService

User = get_user_model()

TITLE_CATALOG = [
    {"name": "The Matrix", "category": TitleCategory.MOVIE, "author": "The Wachowskis"},
    {"name": "Pride and Prejudice", "category": TitleCategory.BOOK, "author": "Jane Austen"},
    {"name": "Star Wars: A New Hope", "category": TitleCategory.MOVIE, "author": "George Lucas"},
    {"name": "Serial", "category": TitleCategory.PODCAST, "author": "Sarah Koenig"},
    {"name": "1984", "category": TitleCategory.BOOK, "author": "George Orwell"},
    {"name": "TED Talk: Do Schools Kill Creativity?", "category": TitleCategory.SPEECH, "author": "Ken Robinson"},
    {"name": "The Crown", "category": TitleCategory.TVSERIES, "author": "Peter Morgan"},
    {"name": "Blue Planet", "category": TitleCategory.TVSERIES, "author": "David Attenborough"},
    {"name": "The Godfather", "category": TitleCategory.MOVIE, "author": "Mario Puzo"},
    {"name": "Dune", "category": TitleCategory.BOOK, "author": "Frank Herbert"},
    {"name": "The Daily", "category": TitleCategory.PODCAST, "author": "Michael Barbaro"},
    {"name": "Sapiens", "category": TitleCategory.BOOK, "author": "Yuval Noah Harari"},
    {"name": "The Dark Knight", "category": TitleCategory.MOVIE, "author": "Christopher Nolan"},
    {"name": "Hamilton", "category": TitleCategory.OTHER, "author": "Lin-Manuel Miranda"},
    {"name": "Planet Money", "category": TitleCategory.PODCAST, "author": "NPR"},
    {"name": "The Expanse", "category": TitleCategory.TVSERIES, "author": "James S. A. Corey"},
    {"name": "Othello", "category": TitleCategory.OTHER, "author": "William Shakespeare"},
    {"name": "The Last Dance", "category": TitleCategory.TVSHOW, "author": "ESPN"},
    {"name": "The Hobbit", "category": TitleCategory.BOOK, "author": "J. R. R. Tolkien"},
    {"name": "Arrival", "category": TitleCategory.MOVIE, "author": "Denis Villeneuve"},
]

RECAP_SNIPPETS = [
    "Bullet time still feels brand new.",
    "Tea-time gossip doubles as battlefield planning.",
    "The rebellion starts with a stolen blueprint and a sarcastic droid.",
    "Investigative tape hiss keeps the suspense humming.",
    "Big Brother never sleeps, even during lunch.",
    "Creativity wins by asking kids to keep daydreaming.",
    "Palace intrigue is just group chat drama with tiaras.",
    "Ocean life monologues like it’s a prestige drama.",
    "Family dinners come with vendettas for dessert.",
    "Desert politics make space travel look easy.",
    "Morning news but make it cinematic.",
    "Human history summarized like a coffee shop debate.",
    "Gotham therapy involves capes and gravelly speeches.",
    "Founding Fathers rap battle on every beat.",
    "Economics explained via tote bags and dad jokes.",
    "Belters, Earthers, and Martians share awkward elevator rides.",
    "Jealousy ruins everyone’s night at the theater.",
    "Basketball flashbacks edited like a heist movie.",
    "There and back again mostly for snacks.",
    "Aliens finally teach us to text with circles.",
]

RECAP_DETAILS = [
    "Toss in a reluctant hero and call it a night.",
    "Everyone pretends this is fine, spoilers: it isn’t.",
    "Soundtracked by synths, whispers, and occasional explosions.",
    "If you blink, you miss another twist of the knife.",
    "Powered by flashbacks, voiceovers, and inconvenient truths.",
    "A sidekick steals the scene while spreadsheets smolder.",
    "Plenty of cliffhangers to keep the group chat buzzing.",
    "Someone monologues, someone gasps, everyone presses play again.",
    "Ends on a question mark just to be dramatic.",
    "Wraps up with a wink that begs for fan theories.",
]

TARGET_TITLE_COUNT = 20
TARGET_USER_COUNT = 10
TARGET_RECAP_COUNT = 30
VOTERS_TO_USE = 6
DEFAULT_PASSWORD = "NotSoLong123!"


class Command(BaseCommand):
    help = "Populate the database with demo titles, users, recaps, and votes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Clear existing demo data before inserting fresh records.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            help="Optional random seed for reproducible output.",
        )

    def handle(self, *args, **options):
        if options["seed"] is not None:
            random.seed(options["seed"])

        if not options["force"] and Title.objects.exists():
            raise CommandError("Database already contains titles. Re-run with --force to rebuild demo data.")

        with transaction.atomic():
            if options["force"]:
                Vote.objects.all().delete()
                Recap.objects.all().delete()
                Title.objects.all().delete()
                User.objects.filter(email__endswith="@notsolong.io").delete()

            users = self._create_users()
            titles = self._create_titles(users)
            recaps = self._create_recaps(users, titles)
            vote_total = self._create_votes(users, recaps)
            VoteService.refresh_vote_metrics()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(users)} users, {len(titles)} titles, {len(recaps)} recaps, and {vote_total} votes."
            )
        )

    def _create_users(self):
        users = []
        for idx in range(1, TARGET_USER_COUNT + 1):
            email = f"demo{idx:02d}@notsolong.io"
            display_name = f"Demo User {idx}"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "display_name": display_name,
                },
            )
            changed = False
            if created:
                user.set_password(DEFAULT_PASSWORD)
                changed = True
            if user.email != email:
                user.email = email
                changed = True
            if not user.display_name:
                user.display_name = display_name
                changed = True
            if changed:
                user.save()
            users.append(user)
        return users

    def _create_titles(self, users):
        created_titles = []
        user_cycle = list(users) or [None]
        for entry in TITLE_CATALOG[:TARGET_TITLE_COUNT]:
            created_by = random.choice(user_cycle) if user_cycle[0] else None
            title = Title.objects.create(
                name=entry["name"],
                category=entry["category"],
                author=entry.get("author", ""),
                created_by=created_by,
            )
            created_titles.append(title)
        return created_titles

    def _create_recaps(self, users, titles):
        recaps = []
        if not titles or not users:
            return recaps

        possible_pairs = [(title, user) for title in titles for user in users]
        if not possible_pairs:
            return recaps

        selections = random.sample(possible_pairs, min(TARGET_RECAP_COUNT, len(possible_pairs)))
        for idx, (title, user) in enumerate(selections, start=1):
            snippet = random.choice(RECAP_SNIPPETS)
            detail = random.choice(RECAP_DETAILS)
            text = f"{snippet} {detail} (recap #{idx})"
            recap = Recap.objects.create(title=title, user=user, text=text, score=0)
            recaps.append(recap)
        return recaps

    def _create_votes(self, users, recaps):
        if not recaps:
            return 0
        voters = random.sample(list(users), min(VOTERS_TO_USE, len(users)))
        total = 0
        for voter in voters:
            picks = random.sample(list(recaps), min(random.randint(5, 12), len(recaps)))
            for recap in picks:
                value = random.choice((Vote.UPVOTE, Vote.UPVOTE, Vote.DOWNVOTE))
                Vote.objects.create(user=voter, recap=recap, value=value)
                total += 1
        return total
