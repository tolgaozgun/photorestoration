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
        "credits_10": {"credits": 10},
        "credits_25": {"credits": 25},
        "credits_50": {"credits": 50},
        "credits_100": {"credits": 100},
        "credits_200": {"credits": 200},
        "light_monthly": {"subscription_type": "light_monthly", "days": 30},
        "standard_monthly": {"subscription_type": "standard_monthly", "days": 30},
        "premium_monthly": {"subscription_type": "premium_monthly", "days": 30},
        "light_yearly": {"subscription_type": "light_yearly", "days": 365},
        "standard_yearly": {"subscription_type": "standard_yearly", "days": 365},
        "premium_yearly": {"subscription_type": "premium_yearly", "days": 365},
    }
    
    # Subscription limits
    SUBSCRIPTION_LIMITS = {
        "light_monthly": {"credits": 20},
        "light_yearly": {"credits": 20},
        "standard_monthly": {"credits": 40},
        "standard_yearly": {"credits": 40},
        "premium_monthly": {"credits": 85},
        "premium_yearly": {"credits": 85},
    }

settings = Settings()