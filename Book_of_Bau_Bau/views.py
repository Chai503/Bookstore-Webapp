import random
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import BookForm
from .models import Book, User as AppUser
from .permissions import BookPermission, IsAdminRole
from .serializers import (
    BookSerializer,
    ChangePasswordSerializer,
    ProfileSerializer,
    RegisterSerializer,
    UserSerializer,
)


class LabRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not name or not email or not password:
            return Response({"error": "Please provide name, email, and password"}, status=status.HTTP_400_BAD_REQUEST)

        if AppUser.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = f"{random.randint(100000, 999999)}"

        # Lab 9.3: Password Hashing with bcrypt (Salt rounds = 10)
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

        user = AppUser.objects.create(
            name=name,
            email=email,
            password=hashed_password,
            is_verified=False,
            verification_token=otp_code,
            role='viewer'
        )
        print(f"\n[EMAIL SERVICE] Target: {email}\nVerification Code: {otp_code}\n[SECURITY] Hashed: {hashed_password[:15]}...\n")

        email_sent = False
        email_error = None
        try:
            subject = f"[Book Management] รหัสยืนยันตัวตนของคุณคือ {otp_code}"
            message = (
                f"สวัสดีครับคุณ {name},\n\n"
                f"รหัสยืนยันตัวตน (Verification Code) สำหรับเปิดใช้งานบัญชี Book Management ของคุณคือ:\n\n"
                f"=========================\n"
                f"        {otp_code}\n"
                f"=========================\n\n"
                f"กรุณานำรหัส 6 หลักนี้ไปกรอกบนหน้าเว็บเพื่อยืนยันตัวตนและเข้าใช้งานระบบ\n\n"
                f"ขอแสดงความนับถือ,\n"
                f"Book Management Team"
            )
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', '')
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as e:
            email_error = str(e)
            print(f"[EMAIL SERVICE ERROR] Failed to send email to {email}: {e}\n")

        res_data = {
            "message": f"สมัครสมาชิกสำเร็จ! ระบบได้ส่งรหัสยืนยัน 6 หลักไปที่ {email} เรียบร้อย",
            "user_id": user.id,
            "email": email,
            "email_sent": email_sent,
            "backup_code": otp_code,
        }
        if not email_sent:
            res_data["email_warning"] = f"SMTP notice: {email_error} (ใส่รหัสผ่านใน .env เพื่อส่งเมลจริง)"

        return Response(res_data, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        code = request.data.get('code', '').strip()

        if not email or not code:
            return Response({"error": "กรุณากรอกอีเมลและรหัสยืนยัน 6 หลัก"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = AppUser.objects.get(email=email)
            if user.is_verified:
                request.session['user_id'] = user.id
                request.session['user_name'] = user.name
                request.session['user_email'] = user.email
                return Response({"message": "บัญชีนี้ได้รับการยืนยันแล้ว เข้าสู่ระบบสำเร็จ!"}, status=status.HTTP_200_OK)

            if user.verification_token != code:
                return Response({"error": "รหัสยืนยันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"}, status=status.HTTP_400_BAD_REQUEST)

            user.is_verified = True
            user.verification_token = None
            user.save()

            request.session['user_id'] = user.id
            request.session['user_name'] = user.name
            request.session['user_email'] = user.email

            return Response({
                "message": "ยืนยันรหัสถูกต้อง! ยินดีต้อนรับเข้าสู่ระบบ Book Management",
                "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
            }, status=status.HTTP_200_OK)
        except AppUser.DoesNotExist:
            return Response({"error": "ไม่พบผู้ใช้งานที่ใช้อีเมลนี้"}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        token = request.GET.get('token', '').strip() or request.GET.get('code', '').strip()
        if not token:
            return render(request, 'verify.html', {
                'title': 'Verification Failed',
                'message': 'Verification code is required.'
            })

        try:
            user = AppUser.objects.get(verification_token=token)
            user.is_verified = True
            user.verification_token = None
            user.save()

            request.session['user_id'] = user.id
            request.session['user_name'] = user.name
            request.session['user_email'] = user.email

            return render(request, 'verify.html', {
                'title': 'Email Verified Successfully!',
                'message': f'Welcome, {user.name}! Your account has been verified. You can now access Book Management.'
            })
        except AppUser.DoesNotExist:
            return render(request, 'verify.html', {
                'title': 'Verification Failed',
                'message': 'Invalid or expired verification code.'
            })


class LabLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({"error": "กรุณากรอกอีเมลและรหัสผ่าน"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Handle student ID or partial match convenience
            if email == '6731072':
                email = '67310072'
            user = AppUser.objects.filter(models.Q(email=email) | models.Q(email__startswith=email)).first()
            if not user:
                return Response({"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}, status=status.HTTP_400_BAD_REQUEST)

        # Check bcrypt hash
        is_password_valid = False
        try:
            if user.password.startswith('$2b$') or user.password.startswith('$2a$') or user.password.startswith('$2y$'):
                is_password_valid = bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8'))
            else:
                if user.password == password:
                    is_password_valid = True
                    user.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
                    user.save()
        except Exception:
            is_password_valid = False

        if not is_password_valid:
            return Response({"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_verified:
            return Response({
                "error": "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
                "is_verified": False
            }, status=status.HTTP_403_FORBIDDEN)

        jwt_secret = getattr(settings, 'JWT_SECRET', 'my_bookstore_secret')
        payload = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
            "iat": datetime.now(timezone.utc)
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        request.session['user_id'] = user.id
        request.session['user_name'] = user.name
        request.session['user_email'] = user.email

        return Response({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_verified": user.is_verified
            }
        }, status=status.HTTP_200_OK)


class LabLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        request.session.flush()
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": getattr(user, 'id', None),
            "name": getattr(user, 'name', getattr(user, 'username', '')),
            "email": getattr(user, 'email', ''),
            "role": getattr(user, 'role', 'viewer')
        })


class BookListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [BookPermission]

    def get_queryset(self):
        qs = Book.objects.all()
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                models.Q(title__icontains=q) |
                models.Q(author__icontains=q) |
                models.Q(category__icontains=q)
            )
        sort = self.request.query_params.get('sort', '-id')
        try:
            return qs.order_by(sort)
        except Exception:
            return qs.order_by('-id')


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [BookPermission]
    lookup_field = 'pk'


# Template Views for Legacy Dashboard Support
def register_page(request):
    return render(request, 'register.html')

def login_page(request):
    if request.session.get('user_id'):
        return redirect('dashboard')
    return render(request, 'login.html')

def logout_page(request):
    request.session.flush()
    return redirect('login_page')

def dashboard_view(request):
    return render(request, 'dashboard.html')

def delete_item_view(request, pk):
    if not request.session.get('user_id'):
        return redirect('login_page')
    item = get_object_or_404(Book, pk=pk)
    item.delete()
    return redirect('dashboard')

def edit_item_view(request, pk):
    if not request.session.get('user_id'):
        return redirect('login_page')
    item = get_object_or_404(Book, pk=pk)
    form = BookForm(request.POST or None, instance=item)
    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect('dashboard')

    search = request.GET.get('q', '').strip()
    sort = request.GET.get('sort', '-id')
    items = []
    qs = Book.objects.all()
    if search:
        try:
            qs = qs.filter(title__icontains=search)
        except Exception:
            pass
    try:
        items = qs.order_by(sort)
    except Exception:
        items = qs.order_by('-id')

    return render(request, 'dashboard.html', {
        'form': form,
        'items': items,
        'search': search,
        'current_sort': sort,
        'model_name': 'Book',
        'edit_item': item
    })

from django.contrib.auth.models import User as AuthUser

class RegisterView(generics.CreateAPIView):
    queryset = AuthUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ChangePasswordSerializer(data=request.data)
        if s.is_valid():
            user = request.user
            if hasattr(user, 'check_password') and not user.check_password(s.validated_data['old_password']):
                return Response({"error": "Wrong old password"}, status=status.HTTP_400_BAD_REQUEST)
            if hasattr(user, 'set_password'):
                user.set_password(s.validated_data['new_password'])
                user.save()
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListView(generics.ListCreateAPIView):
    queryset = AuthUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AuthUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    lookup_field = 'id'
