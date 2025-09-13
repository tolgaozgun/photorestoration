from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict
import sys

# Import from backend root directory
sys.path.append('/app')
try:
    from email_service import EmailService
except ImportError:
    # Fallback if email service is not available
    EmailService = None

from ..models import get_db, EmailVerification, LinkedDevice, User
from ..services import UserService
from ..schemas.requests import EmailVerificationRequest, VerifyCodeRequest, RemoveDeviceRequest
from ..schemas.responses import EmailVerificationResponse, VerifyCodeResponse, LinkedDevicesResponse, RemoveDeviceResponse

router = APIRouter()

@router.post("/email/send-verification", response_model=EmailVerificationResponse)
async def send_verification_code(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    email_service = EmailService()
    
    existing_device = db.query(LinkedDevice).filter(
        LinkedDevice.device_id == request.device_id
    ).first()
    
    if existing_device:
        return EmailVerificationResponse(
            success=False,
            message="Device already linked",
            linked_email=existing_device.email
        )
    
    code = email_service.generate_verification_code()
    
    verification = EmailVerification(
        email=request.email,
        device_id=request.device_id,
        device_name=request.device_name,
        verification_code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(verification)
    db.commit()
    
    sent = await email_service.send_verification_email(
        request.email, 
        code, 
        request.device_name
    )
    
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return EmailVerificationResponse(
        success=True,
        message="Verification code sent",
        expires_in_minutes=10
    )

@router.post("/email/verify-code", response_model=VerifyCodeResponse)
async def verify_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db)
):
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == request.email,
        EmailVerification.device_id == request.device_id,
        EmailVerification.verification_code == request.code,
        EmailVerification.verified == False,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    verification.verified = True
    
    linked_device = LinkedDevice(
        email=request.email,
        device_id=request.device_id,
        device_name=verification.device_name,
        device_type=request.device_type
    )
    db.add(linked_device)
    
    user = db.query(User).filter(User.id == request.device_id).first()
    if user:
        if not user.user_metadata:
            user.user_metadata = {}
        user.user_metadata["email"] = request.email
    
    db.commit()
    
    return VerifyCodeResponse(
        success=True,
        message="Device linked successfully",
        device_id=request.device_id,
        email=request.email
    )

@router.get("/email/devices/{email}", response_model=LinkedDevicesResponse)
async def get_linked_devices(
    email: str,
    db: Session = Depends(get_db)
):
    devices = db.query(LinkedDevice).filter(
        LinkedDevice.email == email
    ).order_by(LinkedDevice.linked_at.desc()).all()
    
    return LinkedDevicesResponse(
        email=email,
        devices=[
            {
                "device_id": d.device_id,
                "device_name": d.device_name,
                "device_type": d.device_type,
                "linked_at": d.linked_at.isoformat(),
                "last_active": d.last_active.isoformat()
            }
            for d in devices
        ]
    )

@router.post("/email/remove-device", response_model=RemoveDeviceResponse)
async def remove_device(
    request: RemoveDeviceRequest,
    db: Session = Depends(get_db)
):
    requesting_device = db.query(LinkedDevice).filter(
        LinkedDevice.device_id == request.requesting_device_id,
        LinkedDevice.email == request.email
    ).first()
    
    if not requesting_device:
        raise HTTPException(status_code=403, detail="Requesting device not authorized")
    
    device_to_remove = db.query(LinkedDevice).filter(
        LinkedDevice.device_id == request.device_id_to_remove,
        LinkedDevice.email == request.email
    ).first()
    
    if not device_to_remove:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device_name = device_to_remove.device_name
    db.delete(device_to_remove)
    db.commit()
    
    email_service = EmailService()
    await email_service.send_device_removed_email(request.email, device_name)
    
    return RemoveDeviceResponse(
        success=True,
        message="Device removed successfully",
        removed_device_id=request.device_id_to_remove
    )

@router.get("/sync/history/{email}")
async def get_synced_history(
    email: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    from ..services import AnalyticsService
    
    return AnalyticsService.get_synced_history(db, email, limit, offset)

@router.get("/enhancements/{user_id}")
async def get_user_enhancements(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    from ..services import AnalyticsService
    
    return AnalyticsService.get_user_enhancements(db, user_id, limit, offset)