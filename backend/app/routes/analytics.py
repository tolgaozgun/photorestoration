from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict
from ..models import get_db
from ..services import AnalyticsService
from ..schemas.requests import AnalyticsRequest
from ..schemas.responses import AnalyticsResponse

router = APIRouter()

@router.post("/analytics", response_model=AnalyticsResponse)
async def track_analytics(request: AnalyticsRequest, db: Session = Depends(get_db)):
    event_id = AnalyticsService.track_event(
        db,
        request.user_id,
        request.event_type,
        request.event_data,
        request.platform,
        request.app_version
    )
    
    return AnalyticsResponse(success=True, event_id=event_id)

@router.get("/health")
async def health_check():
    from datetime import datetime
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@router.get("/")
async def root_health():
    from datetime import datetime
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}