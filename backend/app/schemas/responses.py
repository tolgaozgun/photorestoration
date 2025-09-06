from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class EnhancementResponse(BaseModel):
    enhancement_id: str
    enhanced_url: str
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