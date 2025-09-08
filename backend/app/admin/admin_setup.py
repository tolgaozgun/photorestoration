from sqladmin import Admin, ModelView
from ..models import User, Purchase, Enhancement, AnalyticsEvent, EmailVerification, LinkedDevice, MenuItem, MenuSection
from .menu_management import MenuManagementView

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.created_at, User.credits, User.subscription_type, User.subscription_expires, User.daily_credits_used, User.daily_reset_at, User.user_metadata]

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

class MenuSectionAdmin(ModelView, model=MenuSection):
    column_list = [MenuSection.id, MenuSection.name, MenuSection.title, MenuSection.description, MenuSection.icon, MenuSection.layout, MenuSection.sort_order, MenuSection.is_active, MenuSection.created_at, MenuSection.updated_at]
    column_searchable_list = [MenuSection.name, MenuSection.title, MenuSection.description]
    column_sortable_list = [MenuSection.name, MenuSection.title, MenuSection.sort_order, MenuSection.created_at]
    form_columns = [MenuSection.name, MenuSection.title, MenuSection.description, MenuSection.icon, MenuSection.layout, MenuSection.sort_order, MenuSection.is_active, MenuSection.meta_data]

class MenuItemAdmin(ModelView, model=MenuItem):
    column_list = [MenuItem.id, MenuItem.title, MenuItem.description, MenuItem.icon, MenuItem.action_type, MenuItem.action_value, MenuItem.section_id, MenuItem.parent_id, MenuItem.sort_order, MenuItem.is_active, MenuItem.is_premium, MenuItem.requires_auth, MenuItem.created_at, MenuItem.updated_at]
    column_searchable_list = [MenuItem.title, MenuItem.description, MenuItem.action_value]
    column_sortable_list = [MenuItem.title, MenuItem.sort_order, MenuItem.created_at]
    form_columns = [MenuItem.title, MenuItem.description, MenuItem.icon, MenuItem.action_type, MenuItem.action_value, MenuItem.section_id, MenuItem.parent_id, MenuItem.sort_order, MenuItem.is_active, MenuItem.is_premium, MenuItem.requires_auth, MenuItem.meta_data]

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
    admin.add_view(MenuSectionAdmin)
    admin.add_view(MenuItemAdmin)
    admin.add_view(MenuManagementView())
    
    return admin