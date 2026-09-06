from django.db import migrations


def seed_categories(apps, schema_editor):
    """
    საწყისი კატეგორიების შექმნა ნებისმიერ გარემოში (ლოკალურად თუ production-ში),
    რომ 'კურსის დამატება' ფორმას ცარიელი dropdown არ ჰქონდეს პირველივე გაშვებისას.
    idempotent-ია - get_or_create-ს იყენებს, ამიტომ განმეორებით გაშვება უსაფრთხოა.
    """
    Category = apps.get_model('courses', 'Category')
    default_categories = [
        ('კომპიუტერული მეცნიერება', 'ზოგადი დისციპლინა'),
        ('კიბერუსაფრთხოება', 'კიბერუსაფრთხოება'),
        ('ვებ-დეველოპმენტი', 'Frontend & Backend ტექნოლოგიები'),
        ('მონაცემთა მეცნიერება', 'Data Science და ანალიტიკა'),
    ]
    for name, description in default_categories:
        Category.objects.get_or_create(name=name, defaults={'description': description})


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_backfill_profiles'),
    ]

    operations = [
        migrations.RunPython(seed_categories, noop),
    ]
