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

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)  # emoji or icon identifier
    action_type = Column(String, nullable=False)  # 'screen', 'url', 'action', 'section'
    action_value = Column(String, nullable=True)  # screen name, URL, action identifier
    parent_id = Column(String, nullable=True, index=True)  # for nested menus
    section_id = Column(String, nullable=True, index=True)  # for grouping
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    requires_auth = Column(Boolean, default=False)
    meta_data = Column(JSON, default={})  # additional configuration (renamed from metadata)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MenuSection(Base):
    __tablename__ = "menu_sections"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)  # emoji or icon identifier
    layout = Column(String, default='grid')  # 'grid', 'list', 'horizontal'
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    meta_data = Column(JSON, default={})  # additional configuration (renamed from metadata)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MenuVersion(Base):
    __tablename__ = "menu_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    version = Column(String, nullable=False, unique=True)  # semantic version (e.g., "1.0.0")
    environment = Column(String, nullable=False)  # 'development', 'staging', 'production'
    menu_config = Column(JSON, nullable=False)  # complete menu configuration
    changelog = Column(String, nullable=True)  # description of changes
    is_active = Column(Boolean, default=False)  # currently deployed version
    is_development = Column(Boolean, default=False)  # development version
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=True)  # admin user who created it
    deployed_at = Column(DateTime, nullable=True)  # when this version was deployed

class MenuDeployment(Base):
    __tablename__ = "menu_deployments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    version_id = Column(String, nullable=False)  # reference to MenuVersion
    environment = Column(String, nullable=False)  # 'development', 'staging', 'production'
    deployed_at = Column(DateTime, default=datetime.utcnow)
    deployed_by = Column(String, nullable=True)  # admin user who deployed it
    status = Column(String, default="success")  # 'success', 'failed', 'rolled_back'
    rollback_version_id = Column(String, nullable=True)  # if rolled back, reference to previous version

# Create all tables
Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()