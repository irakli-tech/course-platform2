from django.db import migrations


def create_missing_profiles(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Profile = apps.get_model('courses', 'Profile')
    Course = apps.get_model('courses', 'Course')

    # ვინც უკვე კურსის ავტორია (instructor), ის მასწავლებელია
    teacher_ids = set(Course.objects.values_list('instructor_id', flat=True))

    for user in User.objects.all():
        role = 'teacher' if user.id in teacher_ids else 'student'
        Profile.objects.get_or_create(user=user, defaults={'role': role})


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_course_image_profile'),
    ]

    operations = [
        migrations.RunPython(create_missing_profiles, noop),
    ]
