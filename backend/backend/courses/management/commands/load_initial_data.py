from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import IntegrityError

from courses.models import Course


class Command(BaseCommand):
    help = (
        "თუ ბაზაში კურსები საერთოდ არ არის (ცარიელია), ჩატვირთავს data.json-ს "
        "(ლოკალური dumpdata-ს სრულ ასლს — users, courses, categories და ა.შ.). "
        "თუ ბაზაში უკვე არის მონაცემები, არაფერს აკეთებს, რომ არ დაზიანდეს "
        "production-ში უკვე შეტანილი ინფორმაცია."
    )

    def handle(self, *args, **options):
        if Course.objects.exists():
            self.stdout.write(self.style.SUCCESS(
                "ბაზაში უკვე არის კურსები — data.json-ის ჩატვირთვა გამოტოვებულია."
            ))
            return

        self.stdout.write("ბაზა ცარიელია — ვტვირთავ data.json-ს...")
        try:
            call_command("loaddata", "data.json")
            self.stdout.write(self.style.SUCCESS("data.json წარმატებით ჩაიტვირთა."))
        except IntegrityError as exc:
            self.stdout.write(self.style.WARNING(
                "data.json ვერ ჩაიტვირთა, რადგან ბაზაში უკვე არსებობს სხვა "
                "production მონაცემები (users/profiles), რომლებიც ძველ fixture-ის "
                "ID-ებთან კონფლიქტშია. კურსების ცხრილი ნამდვილად ცარიელია — ეს "
                "სავარაუდოდ ნიშნავს, რომ კატეგორია წაიშალა და კურსებიც კასკადურად "
                "წაიშალა მასთან ერთად. გადაამოწმეთ /admin/courses/category/ და "
                "საჭიროებისამებრ ხელით დაამატეთ კურსები თავიდან. "
                f"დეტალი: {exc}"
            ))
