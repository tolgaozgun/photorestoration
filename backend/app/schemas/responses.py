from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class EnhancementResponse(BaseModel):
    enhancement_id: str
    enhanced_url: str
    thumbnail_url: Optional[str] = None
    preview_url: Optional[str] = None
    blurhash: Optional[str] = None
    watermark: bool
    processing_time: float
    remaining_credits: int
    remaining_today: int

class PurchaseResponse(BaseModel):
    success: bool
    purchase_id: str
    credits: int
    subscription_type: Optional[str]
    subscription_expires: Optional[str]

class RestoreResponse(BaseModel):
    user_id: str
    credits: int
    subscription_type: Optional[str]
    subscription_expires: Optional[str]
    purchases: List[Dict]

class AnalyticsResponse(BaseModel):
    success: bool
    event_id: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str

class EmailVerificationResponse(BaseModel):
    success: bool
    message: str
    verification_code: Optional[str] = None
    expires_in_minutes: Optional[int] = None
    linked_email: Optional[str] = None

class VerifyCodeResponse(BaseModel):
    success: bool
    message: str
    device_id: str
    email: str

class LinkedDevicesResponse(BaseModel):
    email: str
    devices: List[Dict]

class RemoveDeviceResponse(BaseModel):
    success: bool
    message: str
    removed_device_id: str

class SyncHistoryResponse(BaseModel):
    email: str
    enhancements: List[Dict]
    total: int
    synced_devices: int
    limit: int
    offset: int

class UserEnhancementsResponse(BaseModel):
    enhancements: List[Dict]
    total: int
    limit: int
    offset: int

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    last_active: str
    isCurrent: bool
    deviceId: str

class DeviceListResponse(BaseModel):
    devices: List[DeviceResponse]
    success: bool

class DeviceRemoveRequest(BaseModel):
    device_id: str

# Analytics Response Schemas
class AnalyticsSummaryResponse(BaseModel):
    total_users: int
    active_users: int
    total_enhancements: int
    total_purchases: int
    total_revenue: float
    popular_features: List[Dict]
    platform_breakdown: Dict[str, int]
    daily_stats: List[Dict]

class AnalyticsEventsResponse(BaseModel):
    events: List[Dict]
    total: int
    page: int
    limit: int
    has_more: bool

class AnalyticsUserResponse(BaseModel):
    user_id: str
    enhancements_count: int
    purchases_count: int
    total_spent: float
    created_at: datetime
    last_active: datetime
    popular_features: List[str]

class AnalyticsFeatureUsageResponse(BaseModel):
    feature_name: str
    usage_count: int
    unique_users: int
    avg_processing_time: float
    revenue_generated: float

class AnalyticsTimeSeriesResponse(BaseModel):
    date: str
    users: int
    enhancements: int
    purchases: int
    revenue: float

class AnalyticsExportResponse(BaseModel):
    data: List[Dict]
    format: str
    filename: str
    exported_at: datetime

class MenuConfigurationResponse(BaseModel):
    version: str
    config: Dict
    created_at: str
    changelog: Optional[str]

class MenuVersionResponse(BaseModel):
    id: str
    version: str
    environment: str
    changelog: Optional[str]
    is_active: bool
    is_development: bool
    created_at: str
    deployed_at: Optional[str]
    created_by: Optional[str]

class MenuDeploymentResponse(BaseModel):
    id: str
    version_id: str
    environment: str
    status: str
    deployed_at: str
    deployed_by: Optional[str]