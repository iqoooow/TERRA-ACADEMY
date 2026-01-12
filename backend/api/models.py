from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('parent', 'Parent'),
        ('owner', 'Owner'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    phone = models.CharField(max_length=20)
    birth_date = models.DateField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'role']

    def __str__(self):
        return f"{self.email} ({self.role} - {self.status})"
