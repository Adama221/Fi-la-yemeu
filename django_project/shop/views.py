import uuid
import random
import string
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Product, Order, Affiliate, Commission, SiteSettings, PaymentConfig
from .serializers import (
    ProductSerializer, OrderSerializer, UserSerializer,
    AffiliateSerializer, CommissionSerializer, SiteSettingsSerializer, PaymentConfigSerializer
)
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Sum

User = get_user_model()

# ================= LOGIN / REGISTER ====================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    email = request.data.get('email')
    target_email = email or 'pape@samabutik.com' # Fallback for local dev
    
    user = User.objects.filter(email__iexact=target_email).first()
    if not user:
        role = 'admin' if target_email.lower() in ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'] else 'client'
        username = target_email.split('@')[0]
        # Add random suffix if username exists
        base_username = username
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User.objects.create_user(username=username, email=target_email, password='google-mock-pass')
        user.role = role
        user.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'username': user.username
        }
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def custom_login(request):
    identity = request.data.get('identity', '').strip()
    password = request.data.get('password', '')
    
    if not identity or not password:
        return Response({'error': "L'e-mail et le mot de passe sont requis."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=identity).first() or \
           User.objects.filter(username__iexact=identity).first()
           
    if not user:
        return Response({'error': "Utilisateur introuvable ou identifiants incorrects."}, status=status.HTTP_401_UNAUTHORIZED)
        
    if not user.check_password(password):
        return Response({'error': "Mot de passe incorrect."}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'username': user.username
        }
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def custom_register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '')
    role = request.data.get('role', 'client')
    
    if not email or not password:
        return Response({'error': "L'e-mail et le mot de passe sont requis."}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(email=email).exists():
        return Response({'error': "Cet e-mail est déjà pris."}, status=status.HTTP_400_BAD_REQUEST)
        
    username = username or email.split('@')[0]
    if User.objects.filter(username=username).exists():
        return Response({'error': "Ce nom d'utilisateur est déjà pris."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password, first_name=name)
    user.role = role
    user.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'username': user.username
        }
    }, status=status.HTTP_201_CREATED)

# ================= PRODUCTS ====================
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', '') == 'admin':
            return Product.objects.all().order_by('-id')
        return Product.objects.filter(is_published=True).order_by('-id')
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
        
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'products': serializer.data})

# ================= ORDERS ====================
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'update', 'destroy']:
            # For simplicity matching the frontend logic: POST `/api/orders` might not have token
            if self.action == 'create':
                return [permissions.AllowAny()]
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if getattr(self.request.user, 'role', '') == 'admin':
            return Order.objects.all().order_by('-id')
        if getattr(self.request.user, 'is_authenticated', False):
            return Order.objects.filter(user=self.request.user).order_by('-id')
        return Order.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()
            
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'orders': serializer.data})

# ================= PAYMENTS ====================
def trigger_affiliate_commission(order):
    if not order.affiliate_code:
        return
    try:
        affiliate = Affiliate.objects.get(code=order.affiliate_code)
        amount = float(order.total) * 0.10
        Commission.objects.create(affiliate=affiliate, amount=amount, status='approved', order=order)
        affiliate.balance += amount
        affiliate.save()
    except Affiliate.DoesNotExist:
        pass

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def validate_wave_payment(request):
    order_id = request.data.get('order_id')
    transaction_id = request.data.get('transaction_id')
    
    try:
        order = Order.objects.get(id=order_id)
        if order.status == 'payé':
            return Response({'error': "Déjà payé"}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = 'payé'
        order.transaction_id = transaction_id
        order.save()
        
        trigger_affiliate_commission(order)
        return Response({'message': "Paiement validé"})
    except Order.DoesNotExist:
        return Response({'error': "Order not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def initiate_orange_payment(request):
    amount = request.data.get('amount')
    orderId = request.data.get('orderId')
    return Response({
        'payment_url': f"/success?orderId={orderId}&amount={amount}&method=orange",
        'msg': "Orange payment initiated"
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def payment_webhook_orange(request):
    order_id = request.data.get('order_id')
    status_payment = request.data.get('status')
    
    if status_payment == 'SUCCESS' and order_id:
        try:
            order = Order.objects.get(id=order_id)
            if order.status != 'payé':
                order.status = 'payé'
                order.transaction_id = request.data.get('transaction_id')
                order.save()
                trigger_affiliate_commission(order)
            return Response({'ok': True})
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)

# ================= AFFILIATES ====================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def affiliate_dashboard(request):
    user = request.user
    affiliate = Affiliate.objects.filter(user=user).first()
    if not affiliate:
        return Response({'isAffiliate': False})
        
    commissions = Commission.objects.filter(affiliate=affiliate).order_by('-created_at')
    return Response({
        'isAffiliate': True,
        'affiliate': AffiliateSerializer(affiliate).data,
        'commissions': CommissionSerializer(commissions, many=True).data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def affiliate_apply(request):
    user = request.user
    if Affiliate.objects.filter(user=user).exists():
        return Response({'error': 'Vous êtes déjà affilié.'}, status=status.HTTP_400_BAD_REQUEST)
        
    code = 'AFF' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    affiliate = Affiliate.objects.create(user=user, code=code)
    
    user.role = 'affiliate'
    user.save()
    
    return Response({'success': True, 'affiliate': AffiliateSerializer(affiliate).data})

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_affiliates(request):
    affiliates = Affiliate.objects.all()
    return Response({'affiliates': AffiliateSerializer(affiliates, many=True).data})

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_product_create(request):
    serializer = ProductSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_product_update(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(status=404)
    serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def admin_product_delete(request, pk):
    try:
        product = Product.objects.get(pk=pk)
        product.delete()
        return Response({'success': True})
    except Product.DoesNotExist:
        return Response(status=404)
        
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_orders_list(request):
    orders = Order.objects.all().order_by('-id')
    serializer = OrderSerializer(orders, many=True)
    return Response({'orders': serializer.data})

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_dashboard(request):
    products_count = Product.objects.count()
    orders_count = Order.objects.count()
    revenue = Order.objects.aggregate(total=Sum('total'))['total'] or 0
    commissions = Commission.objects.count()
    return Response({
        'products': products_count,
        'orders': orders_count,
        'revenue': revenue,
        'commissions': commissions
    })

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_orders_delivery(request):
    order_id = request.data.get('order_id')
    new_status = request.data.get('status')
    try:
        order = Order.objects.get(id=order_id)
        order.status = new_status
        order.save()
        return Response({'msg': 'status updated'})
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

# ================= SETTINGS ====================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_settings(request):
    settings_obj, _ = SiteSettings.objects.get_or_create(id=1)
    data = SiteSettingsSerializer(settings_obj).data
    if settings_obj.logo: data['logo'] = request.build_absolute_uri(settings_obj.logo.url)
    if settings_obj.cover: data['cover'] = request.build_absolute_uri(settings_obj.cover.url)
    
    return Response({'settings': data})

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def update_settings(request):
    settings_obj, _ = SiteSettings.objects.get_or_create(id=1)
    
    if 'logo' in request.FILES: settings_obj.logo = request.FILES['logo']
    if 'cover' in request.FILES: settings_obj.cover = request.FILES['cover']
    
    if 'primary_color' in request.data: settings_obj.primary_color = request.data['primary_color']
    elif 'color' in request.data: settings_obj.primary_color = request.data['color']
    if 'secondary_color' in request.data: settings_obj.secondary_color = request.data['secondary_color']
    if 'text' in request.data: settings_obj.homepage_text = request.data['text']
    if 'description' in request.data: settings_obj.description = request.data['description']
    if 'font' in request.data: settings_obj.font = request.data['font']
    
    settings_obj.save()
    return Response({'message': "Design modifié"})

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def payment_links(request):
    config_obj, _ = PaymentConfig.objects.get_or_create(id=1)
    if request.method == 'GET':
        return Response(PaymentConfigSerializer(config_obj).data)
    else:
        config_obj.wave_link = request.data.get('wave', config_obj.wave_link)
        config_obj.orange_link = request.data.get('orange', config_obj.orange_link)
        config_obj.save()
        return Response({'msg': "payment links updated"})
