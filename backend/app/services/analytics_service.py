from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from ..models import User, Enhancement, LinkedDevice, Purchase, AnalyticsEvent
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
    
    @staticmethod
    def get_analytics_summary(db, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict:
        """Get comprehensive analytics summary"""
        # Set default date range to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Total users
        total_users = db.query(User).count()
        
        # Active users (users with activity in the last 30 days)
        active_users = db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        # Total enhancements
        total_enhancements = db.query(Enhancement).filter(
            Enhancement.created_at >= start_date,
            Enhancement.created_at <= end_date
        ).count()
        
        # Total purchases and revenue
        purchases_query = db.query(Purchase).filter(
            Purchase.created_at >= start_date,
            Purchase.created_at <= end_date,
            Purchase.status == "completed"
        )
        
        total_purchases = purchases_query.count()
        
        # Calculate revenue from purchases (simplified - in real app you'd parse product_id)
        total_revenue = sum(
            float(p.receipt.get('price', 0) if isinstance(p.receipt, dict) else 0) 
            for p in purchases_query.all()
        )
        
        # Popular features from analytics events
        feature_events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.created_at <= end_date,
            AnalyticsEvent.event_type.in_(['feature_used', 'enhancement_started', 'purchase_completed'])
        ).all()
        
        popular_features = {}
        for event in feature_events:
            feature = event.event_data.get('feature', 'unknown')
            popular_features[feature] = popular_features.get(feature, 0) + 1
        
        # Platform breakdown
        platform_stats = db.query(AnalyticsEvent.platform, func.count(AnalyticsEvent.id)).filter(
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.created_at <= end_date
        ).group_by(AnalyticsEvent.platform).all()
        
        platform_breakdown = {platform: count for platform, count in platform_stats}
        
        # Daily stats for time series
        daily_stats = []
        for i in range(30):
            day_start = end_date - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            daily_users = db.query(User).filter(
                User.created_at >= day_start,
                User.created_at < day_end
            ).count()
            
            daily_enhancements = db.query(Enhancement).filter(
                Enhancement.created_at >= day_start,
                Enhancement.created_at < day_end
            ).count()
            
            daily_purchases = db.query(Purchase).filter(
                Purchase.created_at >= day_start,
                Purchase.created_at < day_end,
                Purchase.status == "completed"
            ).count()
            
            daily_revenue = sum(
                float(p.receipt.get('price', 0) if isinstance(p.receipt, dict) else 0)
                for p in db.query(Purchase).filter(
                    Purchase.created_at >= day_start,
                    Purchase.created_at < day_end,
                    Purchase.status == "completed"
                ).all()
            )
            
            daily_stats.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'users': daily_users,
                'enhancements': daily_enhancements,
                'purchases': daily_purchases,
                'revenue': daily_revenue
            })
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'total_enhancements': total_enhancements,
            'total_purchases': total_purchases,
            'total_revenue': total_revenue,
            'popular_features': sorted(popular_features.items(), key=lambda x: x[1], reverse=True)[:10],
            'platform_breakdown': platform_breakdown,
            'daily_stats': daily_stats[::-1]  # Reverse to show chronological order
        }
    
    @staticmethod
    def get_analytics_events(db, page: int = 1, limit: int = 50, event_type: Optional[str] = None, 
                           user_id: Optional[str] = None, start_date: Optional[datetime] = None, 
                           end_date: Optional[datetime] = None) -> Dict:
        """Get analytics events with filtering and pagination"""
        query = db.query(AnalyticsEvent)
        
        if event_type:
            query = query.filter(AnalyticsEvent.event_type == event_type)
        
        if user_id:
            query = query.filter(AnalyticsEvent.user_id == user_id)
        
        if start_date:
            query = query.filter(AnalyticsEvent.created_at >= start_date)
        
        if end_date:
            query = query.filter(AnalyticsEvent.created_at <= end_date)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        events = query.order_by(AnalyticsEvent.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            'events': [
                {
                    'id': event.id,
                    'user_id': event.user_id,
                    'event_type': event.event_type,
                    'event_data': event.event_data,
                    'platform': event.platform,
                    'app_version': event.app_version,
                    'created_at': event.created_at.isoformat()
                }
                for event in events
            ],
            'total': total,
            'page': page,
            'limit': limit,
            'has_more': offset + limit < total
        }
    
    @staticmethod
    def get_user_analytics(db, user_id: str, days: int = 30) -> Dict:
        """Get analytics for a specific user"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # User info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Enhancements count
        enhancements_count = db.query(Enhancement).filter(
            Enhancement.user_id == user_id,
            Enhancement.created_at >= start_date
        ).count()
        
        # Purchases count and total spent
        purchases = db.query(Purchase).filter(
            Purchase.user_id == user_id,
            Purchase.created_at >= start_date,
            Purchase.status == "completed"
        ).all()
        
        purchases_count = len(purchases)
        total_spent = sum(
            float(p.receipt.get('price', 0) if isinstance(p.receipt, dict) else 0)
            for p in purchases
        )
        
        # User's events
        events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id,
            AnalyticsEvent.created_at >= start_date
        ).all()
        
        # Popular features for this user
        feature_usage = {}
        for event in events:
            if event.event_type == 'feature_used':
                feature = event.event_data.get('feature', 'unknown')
                feature_usage[feature] = feature_usage.get(feature, 0) + 1
        
        # Last activity
        last_activity = max(
            (e.created_at for e in events),
            default=user.created_at
        )
        
        return {
            'user_id': user_id,
            'enhancements_count': enhancements_count,
            'purchases_count': purchases_count,
            'total_spent': total_spent,
            'created_at': user.created_at.isoformat(),
            'last_active': last_activity.isoformat(),
            'popular_features': sorted(feature_usage.items(), key=lambda x: x[1], reverse=True)[:5]
        }
    
    @staticmethod
    def get_feature_usage_analytics(db, start_date: Optional[datetime] = None, 
                                  end_date: Optional[datetime] = None) -> List[Dict]:
        """Get feature usage analytics"""
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Get all feature usage events
        events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.event_type == 'feature_used',
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.created_at <= end_date
        ).all()
        
        feature_stats = {}
        for event in events:
            feature = event.event_data.get('feature', 'unknown')
            if feature not in feature_stats:
                feature_stats[feature] = {
                    'usage_count': 0,
                    'unique_users': set(),
                    'processing_times': [],
                    'revenue': 0
                }
            
            feature_stats[feature]['usage_count'] += 1
            feature_stats[feature]['unique_users'].add(event.user_id)
            
            # Collect processing time if available
            processing_time = event.event_data.get('processing_time')
            if processing_time:
                feature_stats[feature]['processing_times'].append(float(processing_time))
            
            # Collect revenue if available
            revenue = event.event_data.get('revenue')
            if revenue:
                feature_stats[feature]['revenue'] += float(revenue)
        
        # Calculate averages and convert sets to counts
        result = []
        for feature, stats in feature_stats.items():
            avg_processing_time = (
                sum(stats['processing_times']) / len(stats['processing_times'])
                if stats['processing_times'] else 0
            )
            
            result.append({
                'feature_name': feature,
                'usage_count': stats['usage_count'],
                'unique_users': len(stats['unique_users']),
                'avg_processing_time': avg_processing_time,
                'revenue_generated': stats['revenue']
            })
        
        return sorted(result, key=lambda x: x['usage_count'], reverse=True)
    
    @staticmethod
    def export_analytics_data(db, format_type: str = 'json', start_date: Optional[datetime] = None, 
                             end_date: Optional[datetime] = None) -> Dict:
        """Export analytics data in various formats"""
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Get all relevant data
        summary = AnalyticsService.get_analytics_summary(db, start_date, end_date)
        events = AnalyticsService.get_analytics_events(db, page=1, limit=10000, start_date=start_date, end_date=end_date)
        feature_usage = AnalyticsService.get_feature_usage_analytics(db, start_date, end_date)
        
        export_data = {
            'export_info': {
                'format': format_type,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'exported_at': datetime.utcnow().isoformat()
            },
            'summary': summary,
            'events': events['events'],
            'feature_usage': feature_usage
        }
        
        return export_data