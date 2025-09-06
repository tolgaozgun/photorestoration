from sqladmin import Admin, ModelView
from ..models import User, Purchase, Enhancement, AnalyticsEvent, EmailVerification, LinkedDevice

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.created_at, User.standard_credits, User.hd_credits, User.subscription_type, User.subscription_expires, User.daily_standard_used, User.daily_hd_used, User.daily_reset_at, User.user_metadata]

class PurchaseAdmin(ModelView, model=Purchase):
    column_list = [Purchase.id, Purchase.user_id, Purchase.receipt, Purchase.product_id, Purchase.platform, Purchase.created_at, Purchase.status]

class EnhancementAdmin(ModelView, model=Enhancement):
    column_list = [Enhancement.id, Enhancement.user_id, Enhancement.original_url, Enhancement.enhanced_url, Enhancement.resolution, Enhancement.mode, Enhancement.created_at, Enhancement.processing_time, Enhancement.watermark]

class AnalyticsEventAdmin(ModelView, model=AnalyticsEvent):
    column_list = [AnalyticsEvent.id, AnalyticsEvent.user_id, AnalyticsEvent.event_type, AnalyticsEvent.event_data, AnalyticsEvent.created_at, AnalyticsEvent.platform, AnalyticsEvent.app_version]

class EmailVerificationAdmin(ModelView, model=EmailVerification):
    column_list = [EmailVerification.id, EmailVerification.email, EmailVerification.device_id, EmailVerification.device_name, EmailVerification.verification_code, EmailVerification.created_at, EmailVerification.expires_at, EmailVerification.verified]

class LinkedDeviceAdmin(ModelView, model=LinkedDevice):
    column_list = [LinkedDevice.id, LinkedDevice.email, LinkedDevice.device_id, LinkedDevice.device_name, LinkedDevice.device_type, LinkedDevice.linked_at, LinkedDevice.last_active]

def setup_admin(app, engine):
    admin = Admin(
        app, 
        engine,
        base_url="/admin",
        title="Photo Restoration Admin",
        logo_url=None,
    )
    
    admin.add_view(UserAdmin)
    admin.add_view(PurchaseAdmin)
    admin.add_view(EnhancementAdmin)
    admin.add_view(AnalyticsEventAdmin)
    admin.add_view(EmailVerificationAdmin)
    admin.add_view(LinkedDeviceAdmin)
    
    return admin