from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models import get_db, User, Purchase
from ..services import UserService
from ..schemas.requests import PurchaseRequest, RestoreRequest
from ..schemas.responses import PurchaseResponse, RestoreResponse
from ..config.settings import settings

router = APIRouter()

@router.post("/purchase", response_model=PurchaseResponse)
async def record_purchase(request: PurchaseRequest, db: Session = Depends(get_db)):
    user = UserService.get_or_create_user(db, request.user_id)
    
    product = settings.PRODUCT_MAPPING.get(request.product_id)
    if not product:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    purchase = Purchase(
        user_id=request.user_id,
        receipt=request.receipt,
        product_id=request.product_id,
        platform=request.platform
    )
    db.add(purchase)
    
    if "standard_credits" in product:
        user.standard_credits += product["standard_credits"]
    elif "hd_credits" in product:
        user.hd_credits += product["hd_credits"]
    elif "subscription_type" in product:
        user.subscription_type = product["subscription_type"]
        user.subscription_expires = datetime.utcnow() + timedelta(days=product["days"])
    
    db.commit()
    
    return PurchaseResponse(
        success=True,
        purchase_id=purchase.id,
        standard_credits=user.standard_credits,
        hd_credits=user.hd_credits,
        subscription_type=user.subscription_type,
        subscription_expires=user.subscription_expires.isoformat() if user.subscription_expires else None
    )

@router.post("/restore", response_model=RestoreResponse)
async def restore_purchases(request: RestoreRequest, db: Session = Depends(get_db)):
    user = UserService.get_or_create_user(db, request.user_id)
    
    purchases = db.query(Purchase).filter(Purchase.user_id == request.user_id).all()
    
    return RestoreResponse(
        user_id=user.id,
        standard_credits=user.standard_credits,
        hd_credits=user.hd_credits,
        subscription_type=user.subscription_type,
        subscription_expires=user.subscription_expires.isoformat() if user.subscription_expires else None,
        purchases=[
            {
                "purchase_id": p.id,
                "product_id": p.product_id,
                "platform": p.platform,
                "created_at": p.created_at.isoformat()
            }
            for p in purchases
        ]
    )