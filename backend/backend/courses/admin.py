from django.contrib import admin
from .models import Category, Course, Enrollment, Profile, StudentHistoryEntry, TeacherAccessCode

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'first_name', 'last_name', 'role', 'phone')
    list_filter = ('role',)
    search_fields = ('user__username', 'first_name', 'last_name', 'phone')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'instructor', 'price', 'duration_weeks', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'description')
    raw_id_fields = ('instructor',)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'course', 'enrolled_at')
    list_filter = ('enrolled_at',)
    search_fields = ('user__username', 'course__title')

@admin.register(StudentHistoryEntry)
class StudentHistoryEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'completed_date', 'created_at')
    list_filter = ('completed_date',)
    search_fields = ('user__username', 'title')

@admin.register(TeacherAccessCode)
class TeacherAccessCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'is_active', 'note', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('code', 'note')
