from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import datetime
from ..models import get_db
from ..services import AnalyticsService
from ..schemas.requests import AnalyticsRequest
from ..schemas.responses import (
    AnalyticsResponse, 
    AnalyticsSummaryResponse,
    AnalyticsEventsResponse,
    AnalyticsUserResponse,
    AnalyticsFeatureUsageResponse,
    AnalyticsExportResponse
)

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

@router.get("/analytics", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics summary"""
    try:
        # Parse date strings if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        summary = AnalyticsService.get_analytics_summary(db, start_dt, end_dt)
        return AnalyticsSummaryResponse(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics summary: {str(e)}")

@router.get("/analytics/events", response_model=AnalyticsEventsResponse)
async def get_analytics_events(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get analytics events with filtering and pagination"""
    try:
        # Parse date strings if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        events = AnalyticsService.get_analytics_events(
            db, page, limit, event_type, user_id, start_dt, end_dt
        )
        return AnalyticsEventsResponse(**events)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics events: {str(e)}")

@router.get("/analytics/users/{user_id}", response_model=AnalyticsUserResponse)
async def get_user_analytics(
    user_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific user"""
    try:
        user_analytics = AnalyticsService.get_user_analytics(db, user_id, days)
        if not user_analytics:
            raise HTTPException(status_code=404, detail="User not found")
        
        return AnalyticsUserResponse(**user_analytics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user analytics: {str(e)}")

@router.get("/analytics/features", response_model=list[AnalyticsFeatureUsageResponse])
async def get_feature_usage_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get feature usage analytics"""
    try:
        # Parse date strings if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        features = AnalyticsService.get_feature_usage_analytics(db, start_dt, end_dt)
        return [AnalyticsFeatureUsageResponse(**feature) for feature in features]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feature analytics: {str(e)}")

@router.get("/analytics/export")
async def export_analytics_data(
    format: str = Query("json", regex="^(json|csv)$", description="Export format"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Export analytics data"""
    try:
        # Parse date strings if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        export_data = AnalyticsService.export_analytics_data(db, format, start_dt, end_dt)
        
        if format == "csv":
            # Convert to CSV format
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write summary data
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Users", export_data["summary"]["total_users"]])
            writer.writerow(["Active Users", export_data["summary"]["active_users"]])
            writer.writerow(["Total Enhancements", export_data["summary"]["total_enhancements"]])
            writer.writerow(["Total Purchases", export_data["summary"]["total_purchases"]])
            writer.writerow(["Total Revenue", export_data["summary"]["total_revenue"]])
            
            # Write daily stats
            writer.writerow([])
            writer.writerow(["Date", "Users", "Enhancements", "Purchases", "Revenue"])
            for stat in export_data["summary"]["daily_stats"]:
                writer.writerow([
                    stat["date"], 
                    stat["users"], 
                    stat["enhancements"], 
                    stat["purchases"], 
                    stat["revenue"]
                ])
            
            csv_content = output.getvalue()
            filename = f"analytics_export_{export_data['export_info']['exported_at'].split('T')[0]}.csv"
            
            return {
                "data": csv_content,
                "format": "csv",
                "filename": filename,
                "exported_at": export_data["export_info"]["exported_at"]
            }
        else:
            return AnalyticsExportResponse(**export_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting analytics: {str(e)}")

@router.get("/analytics/health")
async def analytics_health():
    """Health check for analytics service"""
    return {"status": "healthy", "service": "analytics", "timestamp": datetime.utcnow().isoformat()}

@router.get("/")
async def root_health():
    from datetime import datetime
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}