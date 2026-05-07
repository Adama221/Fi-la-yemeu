from django.contrib import admin
from .models import User, Category, Product, Order, Affiliate, Commission, SiteSettings, PaymentConfig

admin.site.register(User)
admin.site.register(Category)
admin.site.register(Product)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method')

admin.site.register(Affiliate)
admin.site.register(Commission)
admin.site.register(SiteSettings)
admin.site.register(PaymentConfig)
