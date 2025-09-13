from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import re

from ..models import get_db, LinkedDevice
from ..schemas.requests import EmailVerificationRequest
from ..schemas.responses import DeviceResponse, EmailVerificationResponse, DeviceListResponse, DeviceRemoveRequest
try:
    from email_service import EmailService
except ImportError:
    # Fallback if email service is not available
    EmailService = None

router = APIRouter()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@router.post("/email/send-verification", response_model=EmailVerificationResponse)
async def send_verification_code(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Send verification code to email for device linking"""
    
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check if device is already linked to this email
    existing_device = db.query(LinkedDevice).filter(
        LinkedDevice.email == request.email,
        LinkedDevice.device_id == request.device_id
    ).first()
    
    if existing_device:
        return EmailVerificationResponse(
            success=True,
            message="Device already linked to this email",
            verification_code=None
        )
    
    # Generate verification code
    verification_code = ''.join([str(uuid.uuid4().int)[:6]])
    
    # Try to send email
    email_service = EmailService()
    email_sent = await email_service.send_verification_email(
        request.email, 
        verification_code, 
        request.device_name
    )
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    # Store verification code temporarily (in a real app, use Redis or cache)
    # For now, we'll store it in the device record with a verification flag
    verification_expiry = datetime.utcnow() + timedelta(minutes=10)
    
    return EmailVerificationResponse(
        success=True,
        message="Verification code sent successfully",
        verification_code=verification_code  # In production, don't return this
    )

@router.post("/email/verify-code", response_model=EmailVerificationResponse)
async def verify_code(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify the code and link the device"""
    
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # For demo purposes, accept any 6-digit code
    # In production, verify against stored code and check expiry
    if len(request.verification_code) != 6 or not request.verification_code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Check if device is already linked
    existing_device = db.query(LinkedDevice).filter(
        LinkedDevice.email == request.email,
        LinkedDevice.device_id == request.device_id
    ).first()
    
    if existing_device:
        return EmailVerificationResponse(
            success=True,
            message="Device already linked",
            verification_code=None
        )
    
    # Create new linked device
    linked_device = LinkedDevice(
        email=request.email,
        device_id=request.device_id,
        device_name=request.device_name,
        device_type=request.device_type,
        linked_at=datetime.utcnow(),
        last_active=datetime.utcnow()
    )
    
    try:
        db.add(linked_device)
        db.commit()
        db.refresh(linked_device)
        
        return EmailVerificationResponse(
            success=True,
            message="Device linked successfully",
            verification_code=None
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to link device")

@router.get("/email/devices", response_model=DeviceListResponse)
async def get_devices(
    x_email: str = Header(..., alias="X-Email"),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db)
):
    """Get all devices linked to an email"""
    
    if not validate_email(x_email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    devices = db.query(LinkedDevice).filter(
        LinkedDevice.email == x_email
    ).order_by(LinkedDevice.last_active.desc()).all()
    
    device_list = []
    for device in devices:
        device_list.append(DeviceResponse(
            id=device.id,
            name=device.device_name,
            type=device.device_type,
            last_active=device.last_active.isoformat(),
            isCurrent=device.device_id == x_device_id,
            deviceId=device.device_id
        ))
    
    return DeviceListResponse(
        devices=device_list,
        success=True
    )

@router.post("/email/remove-device")
async def remove_device(
    request: DeviceRemoveRequest,
    x_email: str = Header(..., alias="X-Email"),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db)
):
    """Remove a device from the account"""
    
    if not validate_email(x_email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Prevent removing the current device
    if request.device_id == x_device_id:
        raise HTTPException(status_code=400, detail="Cannot remove the current device")
    
    # Find the device to remove
    device_to_remove = db.query(LinkedDevice).filter(
        LinkedDevice.email == x_email,
        LinkedDevice.device_id == request.device_id
    ).first()
    
    if not device_to_remove:
        raise HTTPException(status_code=404, detail="Device not found")
    
    try:
        # Send notification email (optional)
        email_service = EmailService()
        await email_service.send_device_removed_email(
            x_email, 
            device_to_remove.device_name
        )
        
        # Remove the device
        db.delete(device_to_remove)
        db.commit()
        
        return {
            "success": True,
            "message": "Device removed successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to remove device")