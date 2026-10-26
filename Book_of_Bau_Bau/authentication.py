import jwt
import urllib.parse
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import User as AppUser

class BookstoreJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        raw_token = parts[1]
        try:
            token = urllib.parse.unquote(raw_token)
        except Exception:
            token = raw_token

        jwt_secret = getattr(settings, 'JWT_SECRET', 'my_bookstore_secret')

        try:
            payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired, please log in again')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid or expired token')

        user_id = payload.get('id')
        user_email = payload.get('email')
        user_role = payload.get('role', 'viewer')

        user = None
        if user_id:
            user = AppUser.objects.filter(id=user_id).first()
        elif user_email:
            user = AppUser.objects.filter(email=user_email).first()

        if user is None:
            class TransientUser:
                is_authenticated = True
                is_anonymous = False
                id = user_id
                email = user_email
                role = user_role
                name = payload.get('name', user_email)

                def __str__(self):
                    return f"{self.email} ({self.role})"

            return (TransientUser(), token)

        if not hasattr(user, 'role') or not user.role:
            user.role = user_role

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
