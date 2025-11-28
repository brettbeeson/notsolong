from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="NoSoLong",
            new_name="Recap",
        ),
        migrations.RemoveConstraint(
            model_name="recap",
            name="unique_title_user_nosolong",
        ),
        migrations.AddConstraint(
            model_name="recap",
            constraint=models.UniqueConstraint(fields=("title", "user"), name="unique_title_user_recap"),
        ),
        migrations.RemoveConstraint(
            model_name="vote",
            name="unique_quote_vote",
        ),
        migrations.RenameField(
            model_name="vote",
            old_name="quote",
            new_name="recap",
        ),
        migrations.AddConstraint(
            model_name="vote",
            constraint=models.UniqueConstraint(fields=("recap", "user"), name="unique_recap_vote"),
        ),
    ]
