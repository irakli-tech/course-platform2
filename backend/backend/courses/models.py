from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    ROLE_TEACHER = 'teacher'
    ROLE_STUDENT = 'student'
    ROLE_CHOICES = [
        (ROLE_TEACHER, 'მასწავლებელი'),
        (ROLE_STUDENT, 'მოსწავლე'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=50, blank=True, default='')
    last_name = models.CharField(max_length=50, blank=True, default='')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    phone = models.CharField(
        max_length=20, blank=True, default='',
        help_text='საკონტაქტო ტელეფონის ნომერი (მოსწავლისთვის და მასწავლებლისთვის)'
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(
        blank=True, default='',
        help_text=(
            'მასწავლებლის მოკლე აღწერა - განათლება, გამოცდილება, კვალიფიკაცია. '
            'ეს ტექსტი გამოჩნდება კურსის დეტალების გვერდზე, მოსწავლეებისთვის, '
            'როგორც ინფორმაცია მასწავლებლის შესახებ.'
        )
    )

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_teacher(self):
        return self.role == self.ROLE_TEACHER


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """ყოველი ახალი User-ისთვის ავტომატურად იქმნება Profile (default: student)."""
    if created:
        Profile.objects.get_or_create(user=instance)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    syllabus = models.TextField(
        blank=True, default='',
        help_text='რას ისწავლის მოსწავლე ამ კურსზე (თემები/გეგმა)'
    )
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    image = models.ImageField(upload_to='course_images/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='courses')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_courses')
    start_date = models.DateTimeField(
        null=True, blank=True,
        help_text='კურსის დაწყების თარიღი და დრო'
    )
    duration_weeks = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='კურსის ხანგრძლივობა კვირებში (რამდენი ხანი გრძელდება კურსი)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrolled_users')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user.username} -> {self.course.title}"


class StudentHistoryEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='history_entries')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    completed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class TeacherAccessCode(models.Model):

    code = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    note = models.CharField(
        max_length=200, blank=True, default='',
        help_text='მაგ: ვისთვის არის განკუთვნილი ეს კოდი (არასავალდებულო, მხოლოდ ადმინისთვის).'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'მასწავლებლის წვდომის კოდი'
        verbose_name_plural = 'მასწავლებლის წვდომის კოდები'

    def __str__(self):
        return self.code
