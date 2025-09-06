from typing import Dict, List
from datetime import datetime
from ..models import User, Enhancement, LinkedDevice
from ..config.settings import settings

class AnalyticsService:
    @staticmethod
    def track_event(db, user_id: str, event_type: str, event_data: Dict, 
                   platform: str = "mobile", app_version: str = "1.0.0") -> str:
        from ..models import AnalyticsEvent
        
        event = AnalyticsEvent(
            user_id=user_id,
            event_type=event_type,
            event_data=event_data,
            platform=platform,
            app_version=app_version
        )
        db.add(event)
        db.commit()
        return event.id
    
    @staticmethod
    def get_user_enhancements(db, user_id: str, limit: int = 20, offset: int = 0) -> Dict:
        enhancements = db.query(Enhancement).filter(
            Enhancement.user_id == user_id
        ).order_by(
            Enhancement.created_at.desc()
        ).limit(limit).offset(offset).all()
        
        results = []
        for e in enhancements:
            results.append({
                "id": e.id,
                "original_url": f"/api/image/{e.original_url}",
                "enhanced_url": f"/api/image/{e.enhanced_url}",
                "thumbnail_url": f"/api/image/{e.enhanced_url}?thumbnail=true",
                "resolution": e.resolution,
                "mode": e.mode if hasattr(e, 'mode') else "enhance",
                "created_at": e.created_at.isoformat(),
                "processing_time": e.processing_time,
                "watermark": e.watermark
            })
        
        return {
            "enhancements": results,
            "total": db.query(Enhancement).filter(Enhancement.user_id == user_id).count(),
            "limit": limit,
            "offset": offset
        }
    
    @staticmethod
    def get_synced_history(db, email: str, limit: int = 50, offset: int = 0) -> Dict:
        linked_devices = db.query(LinkedDevice).filter(
            LinkedDevice.email == email
        ).all()
        
        device_ids = [d.device_id for d in linked_devices]
        
        if not device_ids:
            return {
                "email": email,
                "enhancements": [],
                "total": 0,
                "synced_devices": 0
            }
        
        enhancements = db.query(Enhancement).filter(
            Enhancement.user_id.in_(device_ids)
        ).order_by(
            Enhancement.created_at.desc()
        ).limit(limit).offset(offset).all()
        
        results = []
        for e in enhancements:
            results.append({
                "id": e.id,
                "device_id": e.user_id,
                "original_url": f"/api/image/{e.original_url}",
                "enhanced_url": f"/api/image/{e.enhanced_url}",
                "thumbnail_url": f"/api/image/{e.enhanced_url}?thumbnail=true",
                "resolution": e.resolution,
                "mode": e.mode if hasattr(e, 'mode') else "enhance",
                "created_at": e.created_at.isoformat(),
                "processing_time": e.processing_time,
                "watermark": e.watermark
            })
        
        return {
            "email": email,
            "enhancements": results,
            "total": db.query(Enhancement).filter(Enhancement.user_id.in_(device_ids)).count(),
            "synced_devices": len(device_ids),
            "limit": limit,
            "offset": offset
        }