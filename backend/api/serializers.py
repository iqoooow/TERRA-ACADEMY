from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'role', 'status', 'phone', 'birth_date')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password', 'password_confirm', 'phone', 'birth_date', 'role')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            birth_date=validated_data.get('birth_date'),
            role=validated_data.get('role', 'student'),
            status='pending'
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        if self.user.status == 'pending':
            raise serializers.ValidationError(
                {"detail": "Admin tasdiqlamaguncha kira olmaysiz"}, 
                code='authorization'
            )
        elif self.user.status == 'rejected':
            raise serializers.ValidationError(
                {"detail": "Ariza rad etilgan"}, 
                code='authorization'
            )
            
        data['user'] = UserSerializer(self.user).data
        return data
