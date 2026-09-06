# Generated for: student/teacher phone, teacher bio (description), course duration_weeks

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_course_start_date_course_syllabus'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='phone',
            field=models.CharField(
                blank=True, default='', max_length=20,
                help_text='საკონტაქტო ტელეფონის ნომერი (მოსწავლისთვის და მასწავლებლისთვის)'
            ),
        ),
        migrations.AddField(
            model_name='profile',
            name='bio',
            field=models.TextField(
                blank=True, default='',
                help_text=(
                    'მასწავლებლის მოკლე აღწერა - განათლება, გამოცდილება, კვალიფიკაცია. '
                    'ეს ტექსტი გამოჩნდება კურსის დეტალების გვერდზე, მოსწავლეებისთვის, '
                    'როგორც ინფორმაცია მასწავლებლის შესახებ.'
                )
            ),
        ),
        migrations.AddField(
            model_name='course',
            name='duration_weeks',
            field=models.PositiveIntegerField(
                blank=True, null=True,
                help_text='კურსის ხანგრძლივობა კვირებში (რამდენი ხანი გრძელდება კურსი)'
            ),
        ),
    ]
