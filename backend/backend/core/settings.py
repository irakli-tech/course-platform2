import os
import dj_database_url
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-super-secret-key-for-dev')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# ALLOWED_HOSTS მისამართების სია მძიმით გამოყოფილი გარემოს ცვლადიდან.
# მაგ: ALLOWED_HOSTS=my-backend.onrender.com,my-backend.example.com
_allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_env.split(',') if h.strip()] or ['*']

# Render-ის კონტეინერები nginx/proxy-ს მიღმა მუშაობს, ამიტომ HTTPS სქემა
# X-Forwarded-Proto header-იდან უნდა ამოვიცნოთ.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',

    # cloudinary_storage სავალდებულოდ 'django.contrib.staticfiles'-ის წინ უნდა იყოს.
    'cloudinary_storage',
    'django.contrib.staticfiles',
    'cloudinary',
    
    # 3rd Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local Apps
    'courses',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # CORS ყოველთვის ზემოთ
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Static ფაილებისთვის Production-ში
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database:
# ლოკალურად (DATABASE_URL გარეშე) - SQLite.
# Render-ზე (და ნებისმიერ სხვა გარემოში, სადაც DATABASE_URL მითითებულია) - PostgreSQL.
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # SSL მხოლოდ production postgres-ისთვის (DEBUG=False). ლოკალურ docker-compose
    # postgres კონტეინერს SSL არ აქვს ჩართული, ამიტომ იქ არ ვითხოვთ.
    _needs_ssl = DATABASE_URL.startswith('postgres') and not DEBUG
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=_needs_ssl)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    # DATABASES = {
    #     'default': {
    #         'ENGINE': 'django.db.backends.postgesql',
    #         'NAME': "myproject" ,
    #         'USER':"postgres",
    #         'PASSWORD': "postgres",
    #         'HOST':"db",
    #         'PORT':"5432",
    #     }

    }

# Rest Framework პარამეტრები
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'courses.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 6, # გვერდზე 6 კურსი (?page_size=N-ით შესაძლებელია შეცვლა, მაქს. 50)
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

# JWT ტოკენის პარამეტრები
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'True') == 'True'

# წარმოებაში სჯობს CORS_ALLOW_ALL_ORIGINS=False და კონკრეტული frontend
# დომენების მითითება, მაგ: CORS_ALLOWED_ORIGINS=https://my-frontend.onrender.com
_cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins_env.split(',') if o.strip()]

# რეგექსით origin-ების დაშვება (მაგ. ნებისმიერი *.onrender.com სუბდომენი წინასწარი
# ზუსტი URL-ის ცოდნის გარეშე): CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.onrender\.com$
_cors_regex_env = os.environ.get('CORS_ALLOWED_ORIGIN_REGEXES', '')
CORS_ALLOWED_ORIGIN_REGEXES = [r.strip() for r in _cors_regex_env.split(',') if r.strip()]

# CSRF-ისთვის სანდო origin-ები (საჭიროა /admin/-ის Render/HTTPS-ზე გამოსაყენებლად)
_csrf_origins_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins_env.split(',') if o.strip()]

# წარმოებაში (DEBUG=False) ვრთავთ სტანდარტულ Django უსაფრთხოების პარამეტრებს HTTPS-ისთვის.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 7  # 1 კვირა (გაზარდეთ სტაბილურობის შემდეგ)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tbilisi'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- Cloudinary: user-ის მიერ საიტიდან ატვირთული სურათები (course_images, avatars) ---
# ინახება Cloudinary-ზე, არა Render-ის დროებით დისკზე - ამიტომ restart-ზე აღარ იკარგება.
# საჭირო env ცვლადები Render-ზე: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# (უფასო ანგარიში: https://cloudinary.com/users/register/free)
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# ლოკალურად (env ცვლადების გარეშე) ვინახავთ ძველებურად, დისკზე - რომ ლოკალური დეველოპმენტი
# Cloudinary ანგარიშის გარეშეც იმუშაოს. Render-ზე (როცა env ცვლადები მითითებულია) - Cloudinary-ზე.
if os.environ.get('CLOUDINARY_CLOUD_NAME'):
    STORAGES = {
        "default": {
            "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
