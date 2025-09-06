import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")
    DB_TYPE = os.getenv("DB_TYPE", "postgres").lower()
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_PORT = os.getenv("DB_PORT")
    DB_SSLMODE = os.getenv("DB_SSLMODE")
    DB_PARAMS = os.getenv("DB_PARAMS")
    
    # MinIO/S3
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "photo-restoration")
    
    # Google AI
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    
    # Email Service
    EMAIL_HOST = os.getenv("EMAIL_HOST")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    EMAIL_FROM = os.getenv("EMAIL_FROM")
    
    # App Settings
    APP_NAME = "Photo Restoration API"
    APP_VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Product mappings
    PRODUCT_MAPPING = {
        "standard_25": {"standard_credits": 25},
        "standard_70": {"standard_credits": 70},
        "standard_150": {"standard_credits": 150},
        "hd_10": {"hd_credits": 10},
        "hd_30": {"hd_credits": 30},
        "hd_70": {"hd_credits": 70},
        "light_monthly": {"subscription_type": "light_monthly", "days": 30},
        "standard_monthly": {"subscription_type": "standard_monthly", "days": 30},
        "premium_monthly": {"subscription_type": "premium_monthly", "days": 30},
        "light_yearly": {"subscription_type": "light_yearly", "days": 365},
        "standard_yearly": {"subscription_type": "standard_yearly", "days": 365},
        "premium_yearly": {"subscription_type": "premium_yearly", "days": 365},
    }
    
    # Subscription limits
    SUBSCRIPTION_LIMITS = {
        "light_monthly": {"standard": 15, "hd": 5},
        "light_yearly": {"standard": 15, "hd": 5},
        "standard_monthly": {"standard": 30, "hd": 10},
        "standard_yearly": {"standard": 30, "hd": 10},
        "premium_monthly": {"standard": 60, "hd": 25},
        "premium_yearly": {"standard": 60, "hd": 25},
    }

settings = Settings()