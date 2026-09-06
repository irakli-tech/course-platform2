from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('courses.urls')),
]

# შენიშვნა: სტანდარტულად Django media ფაილებს მხოლოდ DEBUG=True-ზე ემსახურება.
# ამ პროექტს (მცირე მასშტაბი, Render Free) არ აქვს ცალკე media-სერვერი/CDN,
# ამიტომ შეგნებულად ვრთავთ ამ სერვირებას production-შიც (DEBUG=False),
# რომ /media/... სურათები ბრაუზერში აისახოს.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
