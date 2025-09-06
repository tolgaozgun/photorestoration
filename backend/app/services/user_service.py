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
            user.daily_standard_used = 0
            user.daily_hd_used = 0
            user.daily_reset_at = datetime.utcnow()
        
        if user.subscription_type and user.subscription_expires > datetime.utcnow():
            limits = settings.SUBSCRIPTION_LIMITS.get(user.subscription_type, {"standard": 0, "hd": 0})
            return {
                "remaining_today_standard": max(0, limits["standard"] - user.daily_standard_used),
                "remaining_today_hd": max(0, limits["hd"] - user.daily_hd_used)
            }
        
        return {
            "remaining_today_standard": 0,
            "remaining_today_hd": 0
        }
    
    @staticmethod
    def has_credits(user: User, resolution: str) -> bool:
        daily_limits = UserService.check_daily_limits(user)
        is_hd = resolution.lower() == "hd"
        
        return (
            (user.hd_credits > 0 or daily_limits["remaining_today_hd"] > 0) if is_hd
            else (user.standard_credits > 0 or daily_limits["remaining_today_standard"] > 0)
        )
    
    @staticmethod
    def deduct_credits(user: User, resolution: str) -> None:
        daily_limits = UserService.check_daily_limits(user)
        is_hd = resolution.lower() == "hd"
        
        if is_hd:
            if user.hd_credits > 0:
                user.hd_credits -= 1
            elif daily_limits["remaining_today_hd"] > 0:
                user.daily_hd_used += 1
        else:
            if user.standard_credits > 0:
                user.standard_credits -= 1
            elif daily_limits["remaining_today_standard"] > 0:
                user.daily_standard_used += 1
    
    @staticmethod
    def refund_credits(user: User, resolution: str) -> None:
        is_hd = resolution.lower() == "hd"
        
        if is_hd:
            if user.daily_hd_used > 0:
                user.daily_hd_used -= 1
            else:
                user.hd_credits += 1
        else:
            if user.daily_standard_used > 0:
                user.daily_standard_used -= 1
            else:
                user.standard_credits += 1