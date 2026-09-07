from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Course, Enrollment, Profile, StudentHistoryEntry, TeacherAccessCode


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, default=Profile.ROLE_STUDENT)
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=20, required=True, allow_blank=False)
    bio = serializers.CharField(required=False, allow_blank=True, default='')
    teacher_code = serializers.CharField(required=False, allow_blank=True, default='', write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'bio', 'teacher_code']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('მომხმარებელი ამ სახელით უკვე არსებობს.')
        return value

    def validate(self, attrs):
        role = attrs.get('role', Profile.ROLE_STUDENT)
        bio = attrs.get('bio', '')
        if role == Profile.ROLE_TEACHER:
            if not bio.strip():
                raise serializers.ValidationError({
                    'bio': 'მასწავლებლისთვის აღწერის (განათლება/გამოცდილება) მითითება სავალდებულოა.'
                })
            teacher_code = (attrs.get('teacher_code') or '').strip()
            if not teacher_code:
                raise serializers.ValidationError({
                    'teacher_code': 'მასწავლებლად რეგისტრაციისთვის საჭიროა შესვლის კოდი.'
                })
            if not TeacherAccessCode.objects.filter(code=teacher_code, is_active=True).exists():
                raise serializers.ValidationError({
                    'teacher_code': 'შეყვანილი კოდი არასწორია ან აღარ არის აქტიური.'
                })
        return attrs

    def create(self, validated_data):
        role = validated_data.pop('role', Profile.ROLE_STUDENT)
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        phone = validated_data.pop('phone', '')
        bio = validated_data.pop('bio', '')
        validated_data.pop('teacher_code', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.first_name = first_name
        profile.last_name = last_name
        profile.role = role
        profile.phone = phone
        profile.bio = bio if role == Profile.ROLE_TEACHER else ''
        profile.save()
        user.profile = profile
        return user

    def to_representation(self, instance):
        profile = getattr(instance, 'profile', None)
        avatar_url = None
        if profile and profile.avatar:
            request = self.context.get('request')
            avatar_url = request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url

        return {
            'id': instance.id,
            'username': instance.username,
            'email': instance.email,
            'first_name': profile.first_name if profile else instance.first_name,
            'last_name': profile.last_name if profile else instance.last_name,
            'role': profile.role if profile else Profile.ROLE_STUDENT,
            'phone': profile.phone if profile else '',
            'avatar': avatar_url,
            'bio': profile.bio if profile else '',
        }


class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'avatar', 'bio']

    def get_first_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return (profile.first_name if profile and profile.first_name else obj.first_name) or ''

    def get_last_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return (profile.last_name if profile and profile.last_name else obj.last_name) or ''

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.role if profile else Profile.ROLE_STUDENT

    def get_phone(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.phone if profile else ''

    def get_avatar(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url
        return None

    def get_bio(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.bio if profile else ''


class ProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        source='profile.first_name', required=False, allow_blank=True, max_length=50
    )
    last_name = serializers.CharField(
        source='profile.last_name', required=False, allow_blank=True, max_length=50
    )
    phone = serializers.CharField(
        source='profile.phone', required=False, allow_blank=True, max_length=20
    )
    avatar = serializers.ImageField(
        source='profile.avatar', required=False
    )
    bio = serializers.CharField(
        source='profile.bio', required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'bio']
        extra_kwargs = {
            'username': {'validators': []},
            'email': {'validators': []},
        }

    def validate_username(self, value):
        qs = User.objects.filter(username__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('ეს მომხმარებლის სახელი უკვე დაკავებულია.')
        return value

    def validate_email(self, value):
        if value:
            qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('ეს ელფოსტა უკვე გამოყენებულია.')
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        instance = super().update(instance, validated_data)
        profile = getattr(instance, 'profile', None)

        if profile is not None and profile_data:
            if 'first_name' in profile_data:
                profile.first_name = profile_data['first_name']
                instance.first_name = profile_data['first_name']
            if 'last_name' in profile_data:
                profile.last_name = profile_data['last_name']
                instance.last_name = profile_data['last_name']
            if 'phone' in profile_data:
                profile.phone = profile_data['phone']
            if 'avatar' in profile_data:
                profile.avatar = profile_data['avatar']
            if 'bio' in profile_data:
                profile.bio = profile_data['bio']
            profile.save()
            instance.save(update_fields=['first_name', 'last_name'])

        return instance


class TeacherSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'bio', 'phone', 'courses_count']

    def get_first_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return (profile.first_name if profile and profile.first_name else obj.first_name) or ''

    def get_last_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return (profile.last_name if profile and profile.last_name else obj.last_name) or ''

    def get_avatar(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url
        return None

    def get_bio(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.bio if profile else ''

    def get_phone(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.phone if profile else ''

    def get_courses_count(self, obj):
        return getattr(obj, 'courses_count', None) if getattr(obj, 'courses_count', None) is not None \
            else obj.created_courses.count()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    teacher = UserSerializer(source='instructor', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    duration = serializers.CharField(source='duration_weeks', read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'syllabus', 'price', 'image',
            'category', 'category_name', 'instructor', 'teacher', 'teacher_name', 
            'start_date', 'duration_weeks', 'duration',
            'is_enrolled', 'students_count', 'created_at'
        ]

    def get_teacher_name(self, obj):
        instructor = getattr(obj, 'instructor', None)
        if instructor:
            profile = getattr(instructor, 'profile', None)
            if profile:
                full_name = f"{profile.first_name} {profile.last_name}".strip()
                if full_name:
                    return full_name
            full_name = f"{instructor.first_name} {instructor.last_name}".strip()
            if full_name:
                return full_name
            return instructor.username
        return "მასწავლებელი ვერ მოიძებნა"

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False

    def get_students_count(self, obj):
        if hasattr(obj, 'enrolled_users'):
            return obj.enrolled_users.count()
        return Enrollment.objects.filter(course=obj).count()


class EnrolledStudentSerializer(serializers.ModelSerializer):
    student = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'enrolled_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course', queryset=Course.objects.all(), write_only=True
    )

    class Meta:
        model = Enrollment
        fields = ['id', 'user', 'course', 'course_id', 'enrolled_at']
        read_only_fields = ['user']


class StudentHistoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentHistoryEntry
        fields = ['id', 'title', 'description', 'completed_date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('კურსის სახელწოდება სავალდებულოა.')
        return value.strip()
