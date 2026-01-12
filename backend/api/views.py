from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class AdminRegistrationRequestsView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Only owner can see registration requests
        if self.request.user.role != 'owner':
            return User.objects.none()
        return User.objects.filter(status='pending')

class AdminApproveUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        if request.user.role != 'owner':
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            action = request.data.get('action') # 'approve' or 'reject'
            reason = request.data.get('reason', '')

            if action == 'approve':
                user.status = 'approved'
                user.save()
                
                # Notification Placeholder
                print(f"DEBUG: Sending Approval SMS/Email to {user.email}...")
                print(f"SMS: Tabriklaymiz! Sizning TERRA ACADEMY arizangiz tasdiqlandi. Tizimga kirishingiz mumkin.")
                
                return Response({"detail": "User approved successfully."})
            elif action == 'reject':
                user.status = 'rejected'
                user.save()
                
                # Notification Placeholder
                print(f"DEBUG: Sending Rejection SMS/Email to {user.email}...")
                print(f"SMS: Uzr, sizning TERRA ACADEMY arizangiz rad etildi. Sabab: {reason}")
                
                return Response({"detail": f"User rejected. Reason: {reason}"})
            else:
                return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
