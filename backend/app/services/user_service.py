from typing import Dict
from datetime import datetime, timedelta
from ..models import User

class UserService:
    @staticmethod
    def get_or_create_user(db, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(id=user_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def check_daily_limits(user: User) -> Dict[str, int]:
        from ..config.settings import settings
        
        if user.daily_reset_at < datetime.utcnow() - timedelta(days=1):
            user.daily_credits_used = 0
            user.daily_reset_at = datetime.utcnow()
        
        if user.subscription_type and user.subscription_expires > datetime.utcnow():
            limit = settings.SUBSCRIPTION_LIMITS.get(user.subscription_type, {"credits": 0})
            return {
                "remaining_today": max(0, limit["credits"] - user.daily_credits_used)
            }
        
        return {
            "remaining_today": 0
        }
    
    @staticmethod
    def has_credits(user: User) -> bool:
        daily_limits = UserService.check_daily_limits(user)
        
        return user.credits > 0 or daily_limits["remaining_today"] > 0
    
    @staticmethod
    def deduct_credits(user: User) -> None:
        daily_limits = UserService.check_daily_limits(user)
        
        if user.credits > 0:
            user.credits -= 1
        elif daily_limits["remaining_today"] > 0:
            user.daily_credits_used += 1
    
    @staticmethod
    def refund_credits(user: User) -> None:
        if user.daily_credits_used > 0:
            user.daily_credits_used -= 1
        else:
            user.credits += 1
    
    @staticmethod
    def get_credits_info(user: User) -> Dict[str, int]:
        daily_limits = UserService.check_daily_limits(user)
        
        return {
            "total_credits": user.credits,
            "remaining_today": daily_limits["remaining_today"],
            "has_credits": user.credits > 0 or daily_limits["remaining_today"] > 0
        }