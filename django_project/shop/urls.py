from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ProductViewSet, OrderViewSet, custom_login, custom_register, google_auth,
    validate_wave_payment, initiate_orange_payment, payment_webhook_orange,
    affiliate_dashboard, affiliate_apply, admin_affiliates,
    admin_dashboard, admin_orders_delivery, admin_orders_list,
    admin_product_create, admin_product_update, admin_product_delete,
    get_settings, update_settings, payment_links
)

router = DefaultRouter(trailing_slash=False)
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    
    path('login', custom_login, name='login'),
    path('auth/google', google_auth, name='google_auth'),
    path('register', custom_register, name='register'),
    path('auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('admin/orders/validate-wave-payment', validate_wave_payment, name='validate_wave_payment'),
    path('pay/orange', initiate_orange_payment, name='initiate_orange_payment'),
    path('webhook/orange', payment_webhook_orange, name='payment_webhook_orange'),
    
    path('affiliate/dashboard', affiliate_dashboard, name='affiliate_dashboard'),
    path('affiliate/apply', affiliate_apply, name='affiliate_apply'),
    path('admin/affiliates', admin_affiliates, name='admin_affiliates'),
    
    path('admin/dashboard', admin_dashboard, name='admin_dashboard'),
    path('admin/orders', admin_orders_list, name='admin_orders_list'),
    path('admin/orders/delivery', admin_orders_delivery, name='admin_orders_delivery'),
    
    path('admin/products', admin_product_create, name='admin_products_create'),
    path('admin/products/<int:pk>', admin_product_delete, name='admin_products_delete'),
    path('admin/products/<int:pk>/update', admin_product_update, name='admin_products_update'),
    
    path('settings', get_settings, name='get_settings'),
    path('admin/design', update_settings, name='update_settings'),
    path('admin/payment-links', payment_links, name='payment_links'),
]
