from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Product, Order, Affiliate, Commission, SiteSettings, PaymentConfig

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'password')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Some react components might expect 'image' instead of 'image_url' or vice versa
        data['image'] = data.get('image_url')
        return data

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'status', 'total', 'payment_reference', 'transaction_id']

    def create(self, validated_data):
        items = validated_data.get('items_json', [])
        total = sum(float(item['price']) * int(item['quantity']) for item in items if 'price' in item and 'quantity' in item)
        if 'total' not in validated_data or not validated_data['total']:
            validated_data['total'] = total
        
        # Decrement stock
        for item in items:
            if 'id' in item and 'quantity' in item:
                try:
                    product = Product.objects.get(id=item['id'])
                    product.stock = max(0, product.stock - int(item['quantity']))
                    product.save()
                except Product.DoesNotExist:
                    pass
                    
        order = Order.objects.create(**validated_data)
        return order

class AffiliateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Affiliate
        fields = '__all__'

class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = '__all__'

class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = '__all__'

class PaymentConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentConfig
        fields = '__all__'
