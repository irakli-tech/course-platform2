from datetime import timedelta
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth.models import User
from .models import Category, Course, Enrollment, Profile, StudentHistoryEntry
from .serializers import (
    CourseSerializer, CategorySerializer,
    EnrollmentSerializer, RegisterSerializer, UserSerializer,
    EnrolledStudentSerializer, ProfileUpdateSerializer, TeacherSerializer,
    StudentHistoryEntrySerializer
)
from .permissions import IsInstructorOrReadOnly, IsTeacherOrReadOnly, IsStudent, IsAdminOrReadOnly


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class TeacherListView(generics.ListAPIView):
    serializer_class = TeacherSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return (
            User.objects.filter(profile__role=Profile.ROLE_TEACHER)
            .select_related('profile')
            .annotate(courses_count=Count('created_courses'))
            .order_by('-courses_count', 'username')
        )


class TeacherCoursesView(generics.ListAPIView):
   
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Course.objects.select_related(
            'category', 'instructor', 'instructor__profile'
        ).filter(instructor_id=self.kwargs['pk']).order_by('-created_at')


class PlatformStatsView(APIView):
   
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'courses_count': Course.objects.count(),
            'categories_count': Category.objects.count(),
            'teachers_count': User.objects.filter(profile__role=Profile.ROLE_TEACHER).count(),
            'students_count': User.objects.filter(profile__role=Profile.ROLE_STUDENT).count(),
        })


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('category', 'instructor', 'instructor__profile').all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsTeacherOrReadOnly, IsInstructorOrReadOnly]

    filterset_fields = ['category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'price']

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        courses = self.get_queryset().filter(instructor=request.user)
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page if page is not None else courses, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsStudent])
    def enroll(self, request, pk=None):
        course = self.get_object()
        user = request.user

        if course.start_date:
            deadline = course.start_date - timedelta(days=1)
            if timezone.now() >= deadline:
                return Response(
                    {'detail': 'ამ კურსზე მიღება შეწყვეტილია.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        enrollment, created = Enrollment.objects.get_or_create(user=user, course=course)
        if not created:
            return Response({'detail': 'უკვე ჩარიცხული ხართ ამ კურსზე.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'წარმატებით ჩაირიცხეთ კურსზე!'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsStudent])
    def unenroll(self, request, pk=None):
        course = self.get_object()

        if course.start_date and timezone.now() >= course.start_date:
            return Response(
                {'detail': 'კურსი უკვე დაიწყო, ჩარიცხვის გაუქმება შეუძლებელია.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted, _ = Enrollment.objects.filter(user=request.user, course=course).delete()
        if not deleted:
            return Response({'detail': 'ამ კურსზე ჩარიცხული არ ხართ.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'ჩარიცხვა გაუქმებულია.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def students(self, request, pk=None):
        course = self.get_object()
        if course.instructor_id != request.user.id:
            return Response(
                {'detail': 'ამ კურსის მოსწავლეების ნახვა შეუძლია მხოლოდ კურსის ავტორს.'},
                status=status.HTTP_403_FORBIDDEN
            )
        enrollments = Enrollment.objects.filter(course=course).select_related('user__profile').order_by('-enrolled_at')
        serializer = EnrolledStudentSerializer(enrollments, many=True)
        return Response(serializer.data)


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).select_related(
            'course', 'course__category', 'course__instructor'
        )


class StudentHistoryEntryViewSet(viewsets.ModelViewSet):
   
    serializer_class = StudentHistoryEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return StudentHistoryEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
