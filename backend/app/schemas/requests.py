from pydantic import BaseModel
from typing import Optional, List, Dict

class EnhanceRequest(BaseModel):
    user_id: str
    mode: str = "enhance"

class PurchaseRequest(BaseModel):
    user_id: str
    receipt: Dict
    product_id: str
    platform: str

class RestoreRequest(BaseModel):
    user_id: str
    receipts: Optional[List[Dict]] = []

class AnalyticsRequest(BaseModel):
    user_id: str
    event_type: str
    event_data: Dict
    platform: str = "mobile"
    app_version: str = "1.0.0"

class EmailVerificationRequest(BaseModel):
    email: str
    device_id: str
    device_name: str
    device_type: str = "unknown"

class VerifyCodeRequest(BaseModel):
    email: str
    device_id: str
    code: str
    device_type: str = "unknown"

class RemoveDeviceRequest(BaseModel):
    email: str
    device_id_to_remove: str
    requesting_device_id: str

class MenuVersionRequest(BaseModel):
    version: str
    environment: str
    changelog: Optional[str] = None
    is_development: Optional[bool] = False

class MenuDeployRequest(BaseModel):
    version_id: str
    environment: str

class MenuDevelopmentRequest(BaseModel):
    version_id: str