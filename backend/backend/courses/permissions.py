from rest_framework import permissions


class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    მხოლოდ კურსის ავტორს (ინსტრუქტორს) აქვს უფლება შეცვალოს ან წაშალოს ის.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.instructor == request.user


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    კურსის შექმნა (POST) დაშვებულია მხოლოდ 'მასწავლებელი' როლის მქონე
    ავტორიზებული მომხმარებლისთვის. კითხვა (GET) ღიაა ყველასთვის.
    """
    message = 'კურსის დამატება შეუძლია მხოლოდ მასწავლებელს.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.is_teacher)


class IsStudent(permissions.BasePermission):
    """მხოლოდ 'მოსწავლე' როლის მქონე მომხმარებელს შეუძლია კურსზე ჩარიცხვა."""
    message = 'კურსზე ჩარიცხვა შეუძლია მხოლოდ მოსწავლეს.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        profile = getattr(user, 'profile', None)
        return bool(profile and not profile.is_teacher)
