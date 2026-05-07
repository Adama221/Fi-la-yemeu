from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [('admin', 'Admin'), ('client', 'Client'), ('affiliate', 'Affilié')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    
    def save(self, *args, **kwargs):
        if self.email and self.email.lower().strip() in ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com']:
            self.role = 'admin'
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    commission = models.DecimalField(max_digits=5, decimal_places=2, default=10.0) # percentage
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('payé', 'Payé'),
        ('expédié', 'Expédié'),
        ('livré', 'Livré'),
        ('annulé', 'Annulé'),
    ]
    PAYMENT_CHOICES = [('wave', 'Wave'), ('orange_money', 'Orange Money')]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    payment_reference = models.CharField(max_length=100, blank=True, null=True, unique=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    customer_info = models.JSONField(default=dict)
    affiliate_code = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Keeping items in JSON for simplicity matching existing React expects
    items_json = models.JSONField(default=list)

class Affiliate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=50, unique=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class Commission(models.Model):
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='approved')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class SiteSettings(models.Model):
    logo = models.ImageField(upload_to='design/', null=True, blank=True)
    cover = models.ImageField(upload_to='design/', null=True, blank=True)
    primary_color = models.CharField(max_length=20, default="#000000")
    secondary_color = models.CharField(max_length=20, default="#FFFFFF")
    homepage_text = models.CharField(max_length=255, default="Élégance Intemporelle.")
    description = models.TextField(blank=True)
    font = models.CharField(max_length=50, default="serif")

class PaymentConfig(models.Model):
    wave_link = models.CharField(max_length=255, blank=True)
    orange_link = models.CharField(max_length=255, blank=True)
