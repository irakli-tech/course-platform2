import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "ქმნის superuser-ს DJANGO_SUPERUSER_* გარემოს ცვლადებიდან. "
        "თუ ასეთი მომხმარებელი უკვე არსებობს — არ გამოტოვებს, არამედ "
        "ყოველ დეპლოისას პაროლს ხელახლა აყენებს, რომ Environment tab-ში "
        "მითითებული პაროლი ყოველთვის იმუშაოს."
    )

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD არ არის მითითებული — გამოტოვება."
            ))
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )

        if email:
            user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"superuser '{username}' შეიქმნა."))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"superuser '{username}' უკვე არსებობდა — პაროლი განახლდა Environment tab-ის მიხედვით."
            ))
