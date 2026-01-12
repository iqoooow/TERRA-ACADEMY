from django.urls import path
from .views import RegisterView, CustomTokenObtainPairView, UserProfileView, AdminRegistrationRequestsView, AdminApproveUserView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Admin actions
    path('admin/registration-requests/', AdminRegistrationRequestsView.as_view(), name='admin_registration_requests'),
    path('admin/approve-user/<int:pk>/', AdminApproveUserView.as_view(), name='admin_approve_user'),
]
