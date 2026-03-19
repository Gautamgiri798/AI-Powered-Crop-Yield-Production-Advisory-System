from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
import os

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class GoogleLogin(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        token_str = request.data.get('google_id_token')
        if not token_str:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Note: For production you should pass `os.environ.get('GOOGLE_CLIENT_ID')` instead of `None` to verify audience.
            # Using None allows any valid Google signed token for flexibility during development.
            client_id = os.environ.get('GOOGLE_CLIENT_ID', None)
            if client_id:
                idinfo = id_token.verify_oauth2_token(token_str, google_requests.Request(), client_id)
            else:
                # Bypass client ID validation if not provided in env, but verify Google signature
                idinfo = id_token.verify_oauth2_token(token_str, google_requests.Request())
            
            email = idinfo.get('email')
            if not email:
                return Response({'error': 'Google token did not contain an email'}, status=status.HTTP_400_BAD_REQUEST)
                
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            user = User.objects.filter(email=email).first()
            if not user:
                base_username = email.split('@')[0]
                username = base_username
                count = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{count}"
                    count += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=get_random_string(32),
                    first_name=first_name[:30],
                    last_name=last_name[:30]
                )
            
            auth_token, _ = Token.objects.get_or_create(user=user)
            # Re-fetch user to get correct serialization after create
            user = User.objects.get(id=user.id)
            serializer = UserSerializer(instance=user)
            
            return Response({"token": auth_token.key, "user": serializer.data}, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'error': 'Invalid Google token: ' + str(e)}, status=status.HTTP_400_BAD_REQUEST)

class Login(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        user = get_object_or_404(User, username = request.data['username'])
        if not user.check_password(request.data['password']):
            return Response({"detail":"Not found"}, status=status.HTTP_404_NOT_FOUND)
        token, created = Token.objects.get_or_create(user = user)
        serializer = UserSerializer(instance = user)
        return Response({"token":token.key, "user":serializer.data})

class Signup(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Explicitly set password via set_password to ensure hashing
            if 'password' in request.data:
                user.set_password(request.data['password'])
                user.save()
            
            token, _ = Token.objects.get_or_create(user = user)
            return Response({"token":token.key, "user": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TestToken(APIView):
    def get(self, request):
        return Response("passed for {}".format(request.user.email))

class RequestPasswordReset(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            
            # Get frontend URL from environment
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5000') 
            absurl = f"{frontend_url}/reset-password/{uidb64}/{token}"
            
            email_body = f"Hello, \n Use the link below to reset your password: \n {absurl}"
            data = {
                'email_body': email_body, 
                'to_email': user.email,
                'email_subject': 'Reset your Password'
            }
            
            try:
                send_mail(
                    data['email_subject'],
                    data['email_body'],
                    'noreply@krishisaarthi.com',
                    [data['to_email']],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            return Response({'success': 'We have sent you a link to reset your password'}, status=status.HTTP_200_OK)
            
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class ResetPassword(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            uidb64 = request.data.get('uidb64')
            token = request.data.get('token')
            password = request.data.get('password')
            
            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)
            
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user.set_password(password)
            user.save()
            return Response({'success': 'Password reset successful'}, status=status.HTTP_200_OK)
            
        except DjangoUnicodeDecodeError as identifier:
             return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)