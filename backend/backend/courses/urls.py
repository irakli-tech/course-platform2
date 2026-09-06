from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, CategoryViewSet, EnrollmentViewSet,
    RegisterView, MeView, TeacherListView, TeacherCoursesView,
    StudentHistoryEntryViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'my-courses', EnrollmentViewSet, basename='my-courses')
router.register(r'history', StudentHistoryEntryViewSet, basename='history')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('teachers/', TeacherListView.as_view(), name='teachers'),
    path('teachers/<int:pk>/courses/', TeacherCoursesView.as_view(), name='teacher-courses'),
    path('', include(router.urls)),
]