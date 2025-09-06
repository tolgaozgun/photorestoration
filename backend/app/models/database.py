from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Float, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import uuid
from typing import Optional

def _build_database_url() -> str:
    # Highest priority: full SQLAlchemy URL
    url = os.getenv("DATABASE_URL")
    if url:
        print(f"Using DATABASE_URL from environment: {url.split('@')[0]}@...")
        return url

    # Compose from discrete env vars
    db_type = os.getenv("DB_TYPE", "postgres").lower()
    host = os.getenv("DB_HOST")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    port = os.getenv("DB_PORT")
    sslmode = os.getenv("DB_SSLMODE")  # e.g., require, disable
    params = os.getenv("DB_PARAMS")  # extra query string parameters, e.g. "connect_timeout=10"

    if all([host, name, user]):
        if db_type in ("postgres", "postgresql", "psql"):
            driver = "postgresql+psycopg"
            port = port or "5432"
            auth = f"{user}:{password}" if password else user
            query = []
            if sslmode:
                query.append(f"sslmode={sslmode}")
            if params:
                query.append(params)
            qs = ("?" + "&".join(query)) if query else ""
            return f"{driver}://{auth}@{host}:{port}/{name}{qs}"
        elif db_type in ("mysql", "mariadb"):
            driver = "mysql+pymysql"
            port = port or "3306"
            auth = f"{user}:{password}" if password else user
            query = []
            if params:
                query.append(params)
            qs = ("?" + "&".join(query)) if query else ""
            return f"{driver}://{auth}@{host}:{port}/{name}{qs}"

    # Fallback: local SQLite (not recommended for production)
    print("DATABASE_URL/DB_* not provided. Falling back to SQLite (data will be ephemeral).")
    return "sqlite:///./photo_restoration.db"

DATABASE_URL = _build_database_url()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    future=True,
)

# Log database connection status at startup
def _log_db_connection_status() -> bool:
    try:
        safe_url = engine.url.render_as_string(hide_password=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"✅ Database connection successful: {safe_url}")
        return True
    except Exception as e:
        try:
            safe_url = engine.url.render_as_string(hide_password=True)
        except Exception:
            safe_url = str(engine.url)
        print(f"❌ Database connection failed for {safe_url}: {e}")
        return False

# Attempt connection test and log outcome
_log_db_connection_status()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    credits = Column(Integer, default=0)
    subscription_type = Column(String, nullable=True)
    subscription_expires = Column(DateTime, nullable=True)
    daily_credits_used = Column(Integer, default=0)
    daily_reset_at = Column(DateTime, default=datetime.utcnow)
    user_metadata = Column(JSON, default={})

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, index=True)
    receipt = Column(JSON)
    product_id = Column(String)
    platform = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="completed")

class Enhancement(Base):
    __tablename__ = "enhancements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, index=True)
    original_url = Column(String)
    enhanced_url = Column(String)
    resolution = Column(String)
    mode = Column(String, default="enhance")
    created_at = Column(DateTime, default=datetime.utcnow)
    processing_time = Column(Float)
    watermark = Column(Boolean, default=True)

class AnalyticsEvent(Base):
    __tablename__ = "analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, index=True)
    event_type = Column(String, index=True)
    event_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    platform = Column(String)
    app_version = Column(String)

class EmailVerification(Base):
    __tablename__ = "email_verifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, index=True)
    device_id = Column(String, index=True)
    device_name = Column(String)
    verification_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    verified = Column(Boolean, default=False)
    
class LinkedDevice(Base):
    __tablename__ = "linked_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, index=True)
    device_id = Column(String, unique=True, index=True)
    device_name = Column(String)
    device_type = Column(String)  # ios, android
    linked_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

# Create all tables
Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()