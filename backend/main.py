from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
import os
import io
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import asyncio
from minio import Minio
from minio.error import S3Error
import hashlib
import json
from contextlib import asynccontextmanager
from google import genai
from PIL import Image
import base64
from dotenv import load_dotenv
from image_enhancement import ImageEnhancer
from email_service import EmailService

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./photo_restoration.db")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "photo-restoration")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    standard_credits = Column(Integer, default=0)
    hd_credits = Column(Integer, default=0)
    subscription_type = Column(String, nullable=True)
    subscription_expires = Column(DateTime, nullable=True)
    daily_standard_used = Column(Integer, default=0)
    daily_hd_used = Column(Integer, default=0)
    daily_reset_at = Column(DateTime, default=datetime.utcnow)
    user_metadata = Column(JSON, default={})

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    receipt = Column(JSON)
    product_id = Column(String)
    platform = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="completed")

class Enhancement(Base):
    __tablename__ = "enhancements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
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
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    event_type = Column(String, index=True)
    event_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    platform = Column(String)
    app_version = Column(String)

class EmailVerification(Base):
    __tablename__ = "email_verifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, index=True)
    device_id = Column(String, index=True)
    device_name = Column(String)
    verification_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    verified = Column(Boolean, default=False)
    
class LinkedDevice(Base):
    __tablename__ = "linked_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, index=True)
    device_id = Column(String, unique=True, index=True)
    device_name = Column(String)
    device_type = Column(String)  # ios, android
    linked_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

minio_client = None
image_enhancer = None
email_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global minio_client, image_enhancer, email_service
    
    # Initialize MinIO
    minio_client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )
    
    try:
        if not minio_client.bucket_exists(MINIO_BUCKET):
            minio_client.make_bucket(MINIO_BUCKET)
        print(f"MinIO connected successfully. Bucket '{MINIO_BUCKET}' ready.")
    except Exception as e:
        print(f"WARNING: MinIO connection failed: {e}")
        print(f"MinIO endpoint: {MINIO_ENDPOINT}")
        print("The app will start but image storage won't work until MinIO is available.")
    
    # Initialize image enhancer
    try:
        image_enhancer = ImageEnhancer()
        print("Image enhancer initialized successfully")
    except Exception as e:
        print(f"Warning: Failed to initialize image enhancer: {e}")
        image_enhancer = None
    
    # Initialize email service
    try:
        email_service = EmailService()
        print("Email service initialized successfully")
    except Exception as e:
        print(f"Warning: Failed to initialize email service: {e}")
        email_service = None
    
    yield
    

from sqladmin import Admin, ModelView

app = FastAPI(title="Photo Restoration API", lifespan=lifespan)

# Configure SQLAdmin with detailed debug info
print("\n🔧 CONFIGURING SQLADMIN ADMIN INSTANCE...")
try:
    admin = Admin(
        app, 
        engine,
        base_url="/admin",
        title="Photo Restoration Admin",
        logo_url=None,
    )
    print("✅ SQLAdmin instance created successfully")
    print(f"   Base URL: /admin")
    print(f"   Title: Photo Restoration Admin")
except Exception as e:
    print(f"❌ Failed to create SQLAdmin instance: {e}")
    import traceback
    traceback.print_exc()
    raise

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.created_at, User.standard_credits, User.hd_credits, User.subscription_type, User.subscription_expires, User.daily_standard_used, User.daily_hd_used, User.daily_reset_at, User.user_metadata]

class PurchaseAdmin(ModelView, model=Purchase):
    column_list = [Purchase.id, Purchase.user_id, Purchase.receipt, Purchase.product_id, Purchase.platform, Purchase.created_at, Purchase.status]

class EnhancementAdmin(ModelView, model=Enhancement):
    column_list = [Enhancement.id, Enhancement.user_id, Enhancement.original_url, Enhancement.enhanced_url, Enhancement.resolution, Enhancement.mode, Enhancement.created_at, Enhancement.processing_time, Enhancement.watermark]

class AnalyticsEventAdmin(ModelView, model=AnalyticsEvent):
    column_list = [AnalyticsEvent.id, AnalyticsEvent.user_id, AnalyticsEvent.event_type, AnalyticsEvent.event_data, AnalyticsEvent.created_at, AnalyticsEvent.platform, AnalyticsEvent.app_version]

class EmailVerificationAdmin(ModelView, model=EmailVerification):
    column_list = [EmailVerification.id, EmailVerification.email, EmailVerification.device_id, EmailVerification.device_name, EmailVerification.verification_code, EmailVerification.created_at, EmailVerification.expires_at, EmailVerification.verified]

class LinkedDeviceAdmin(ModelView, model=LinkedDevice):
    column_list = [LinkedDevice.id, LinkedDevice.email, LinkedDevice.device_id, LinkedDevice.device_name, LinkedDevice.device_type, LinkedDevice.linked_at, LinkedDevice.last_active]

admin.add_view(UserAdmin)
admin.add_view(PurchaseAdmin)
admin.add_view(EnhancementAdmin)
admin.add_view(AnalyticsEventAdmin)
admin.add_view(EmailVerificationAdmin)
admin.add_view(LinkedDeviceAdmin)

# ========== COMPREHENSIVE SQLADMIN DEBUG SETUP ==========
print("\n" + "="*60)
print("DEBUGGING SQLADMIN STATIC FILE CONFIGURATION")
print("="*60)

try:
    import sqladmin
    import sys
    import os
    from pathlib import Path
    
    # Debug 1: Module information
    print(f"\n1. SQLADMIN MODULE INFO:")
    print(f"   SQLAdmin version: {getattr(sqladmin, '__version__', 'Unknown')}")
    print(f"   SQLAdmin file location: {sqladmin.__file__}")
    print(f"   SQLAdmin directory: {os.path.dirname(sqladmin.__file__)}")
    
    # Debug 2: Directory contents
    sqladmin_dir = os.path.dirname(sqladmin.__file__)
    print(f"\n2. SQLADMIN DIRECTORY CONTENTS:")
    if os.path.exists(sqladmin_dir):
        for item in sorted(os.listdir(sqladmin_dir)):
            item_path = os.path.join(sqladmin_dir, item)
            item_type = "DIR" if os.path.isdir(item_path) else "FILE"
            print(f"   {item_type}: {item}")
            
            # If it's a directory that might contain static files
            if os.path.isdir(item_path) and any(x in item.lower() for x in ['static', 'asset', 'css', 'js']):
                print(f"      Contents of {item}:")
                try:
                    for subitem in os.listdir(item_path):
                        print(f"        - {subitem}")
                except Exception as e:
                    print(f"        Error reading: {e}")
    
    # Debug 3: Docker-aware static file search
    print(f"\n3. SEARCHING FOR STATIC FILES (DOCKER-ENHANCED):")
    
    # First, let's search the entire Python environment for sqladmin
    print(f"   3a. Dynamic SQLAdmin package search:")
    for sys_path in sys.path:
        if 'site-packages' in sys_path:
            sqladmin_pkg_path = os.path.join(sys_path, 'sqladmin')
            if os.path.exists(sqladmin_pkg_path):
                print(f"       Found SQLAdmin package at: {sqladmin_pkg_path}")
                # Check all subdirectories for static files
                try:
                    for item in os.listdir(sqladmin_pkg_path):
                        item_path = os.path.join(sqladmin_pkg_path, item)
                        if os.path.isdir(item_path) and any(keyword in item.lower() for keyword in ['static', 'asset', 'template']):
                            print(f"       Potential static dir: {item_path}")
                            try:
                                subcontents = os.listdir(item_path)
                                css_files = [f for f in subcontents if f.endswith('.css')]
                                js_files = [f for f in subcontents if f.endswith('.js')]
                                if css_files or js_files:
                                    print(f"         CSS: {css_files}")
                                    print(f"         JS: {js_files}")
                            except Exception as e:
                                print(f"         Error reading: {e}")
                except Exception as e:
                    print(f"       Error scanning SQLAdmin package: {e}")
    
    # Standard potential paths for Docker environments
    potential_paths = [
        os.path.join(sqladmin_dir, 'statics'),
        os.path.join(sqladmin_dir, 'static'), 
        os.path.join(sqladmin_dir, 'assets'),
        os.path.join(sqladmin_dir, 'templates', 'statics'),
        # Docker container paths
        '/usr/local/lib/python3.11/site-packages/sqladmin/statics',
        '/usr/local/lib/python3.11/site-packages/sqladmin/static',
        '/app/lib/python3.11/site-packages/sqladmin/statics',
        '/opt/venv/lib/python3.11/site-packages/sqladmin/statics',
        # Local paths
        './statics',
        './static',
    ]
    
    print(f"\n   3b. Checking predefined paths:")
    for i, static_path in enumerate(potential_paths, 1):
        exists = os.path.exists(static_path)
        print(f"   {i:2d}. {static_path} -> {'EXISTS' if exists else 'NOT FOUND'}")
        
        if exists and os.path.isdir(static_path):
            try:
                contents = os.listdir(static_path)
                css_files = [f for f in contents if f.endswith('.css')]
                js_files = [f for f in contents if f.endswith('.js')]
                print(f"       Total files: {len(contents)}")
                if css_files:
                    print(f"       CSS files: {css_files}")
                if js_files:
                    print(f"       JS files: {js_files[:3]}...")  # Show first 3 JS files
            except Exception as e:
                print(f"       Error reading directory: {e}")
    
    # Debug 4: Environment and Docker detection
    print(f"\n4. ENVIRONMENT INFO:")
    print(f"   Current working directory: {os.getcwd()}")
    print(f"   Python executable: {sys.executable}")
    
    # Check if running in Docker
    is_docker = os.path.exists("/.dockerenv") or os.path.exists("/proc/1/cgroup")
    print(f"   Running in Docker: {is_docker}")
    
    if is_docker:
        print(f"   Docker-specific checks:")
        docker_paths = [
            "/usr/local/lib/python3.11/site-packages",
            "/opt/venv/lib/python3.11/site-packages", 
            "/app/.venv/lib/python3.11/site-packages"
        ]
        for docker_path in docker_paths:
            if os.path.exists(docker_path):
                sqladmin_docker = os.path.join(docker_path, 'sqladmin')
                if os.path.exists(sqladmin_docker):
                    print(f"     Found SQLAdmin in Docker: {sqladmin_docker}")
                    static_docker = os.path.join(sqladmin_docker, 'statics')
                    if os.path.exists(static_docker):
                        print(f"     Found statics in Docker: {static_docker}")
                        # Add this to potential paths for mounting
                        potential_paths.insert(0, static_docker)
    
    print(f"   Python path contains:")
    for path in sys.path[:5]:  # Show first 5 paths
        print(f"     - {path}")
    
    # Debug 5: Try to mount static files
    print(f"\n5. ATTEMPTING TO MOUNT STATIC FILES:")
    static_mounted = False
    
    for i, static_path in enumerate(potential_paths, 1):
        if os.path.exists(static_path):
            try:
                # Since SQLAdmin uses base_url="/admin", it expects static files at "/admin/static"
                # Mount directly at the correct path that SQLAdmin expects
                app.mount("/admin/static", StaticFiles(directory=static_path), name=f"sqladmin_static_{i}")
                print(f"   ✓ SUCCESS: Mounted {static_path} at /admin/static for SQLAdmin")
                static_mounted = True
                
                # Also mount at /static as fallback for any other static file requests
                try:
                    app.mount("/static", StaticFiles(directory=static_path), name=f"static_fallback_{i}")
                    print(f"   ✓ FALLBACK: Also mounted {static_path} at /static")
                except Exception as fallback_error:
                    print(f"   ⚠ Fallback mount failed (not critical): {fallback_error}")
                
                break  # Successfully mounted, exit loop
                    
            except Exception as e:
                print(f"   ✗ ERROR: Could not mount {static_path}: {e}")
    
    if not static_mounted:
        print(f"   ⚠️  WARNING: No static files could be mounted!")
    
    # Debug 6: FastAPI routes after mounting
    print(f"\n6. CURRENT FASTAPI ROUTES:")
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"   {route.methods if hasattr(route, 'methods') else 'MOUNT'}: {route.path}")
            
except Exception as e:
    print(f"\n❌ CRITICAL ERROR in SQLAdmin debug setup: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("END SQLADMIN DEBUG")  
print("="*60 + "\n")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug endpoint to test static file accessibility
@app.get("/debug/static-test")
async def debug_static_files():
    """Debug endpoint to test if static files are accessible"""
    import requests
    import sys
    from pathlib import Path
    
    results = {
        "static_file_tests": [],
        "mounted_paths": [],
        "sqladmin_paths": [],
        "environment": {
            "python_executable": sys.executable,
            "working_dir": os.getcwd(),
            "is_docker": os.path.exists("/.dockerenv")
        }
    }
    
    # Test mounted static file paths
    base_url = "http://localhost:8000"  # Adjust if needed
    test_paths = [
        "/static/css/bootstrap.min.css",
        "/admin/static/css/bootstrap.min.css", 
        "/static/css/main.css",
        "/admin/static/css/main.css"
    ]
    
    for path in test_paths:
        try:
            # Don't actually make HTTP request in this context, just check if files exist
            results["static_file_tests"].append({
                "path": path,
                "status": "endpoint_created_for_testing"
            })
        except Exception as e:
            results["static_file_tests"].append({
                "path": path, 
                "error": str(e)
            })
    
    # Check current FastAPI routes
    for route in app.routes:
        if hasattr(route, 'path'):
            route_info = {
                "path": route.path,
                "methods": getattr(route, 'methods', None) or 'MOUNT'
            }
            results["mounted_paths"].append(route_info)
    
    # Find SQLAdmin package paths
    try:
        import sqladmin
        sqladmin_dir = os.path.dirname(sqladmin.__file__)
        results["sqladmin_paths"].append({
            "package_location": sqladmin_dir,
            "version": getattr(sqladmin, '__version__', 'Unknown')
        })
        
        # Check for static directories
        for item in os.listdir(sqladmin_dir):
            item_path = os.path.join(sqladmin_dir, item)
            if os.path.isdir(item_path) and 'static' in item.lower():
                results["sqladmin_paths"].append({
                    "static_dir": item_path,
                    "exists": os.path.exists(item_path),
                    "contents": os.listdir(item_path) if os.path.exists(item_path) else []
                })
                
    except Exception as e:
        results["sqladmin_paths"].append({"error": str(e)})
    
    return results

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_user(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def check_daily_limits(user: User) -> Dict[str, int]:
    if user.daily_reset_at < datetime.utcnow() - timedelta(days=1):
        user.daily_standard_used = 0
        user.daily_hd_used = 0
        user.daily_reset_at = datetime.utcnow()
    
    subscription_limits = {
        "light_monthly": {"standard": 15, "hd": 5},
        "light_yearly": {"standard": 15, "hd": 5},
        "standard_monthly": {"standard": 30, "hd": 10},
        "standard_yearly": {"standard": 30, "hd": 10},
        "premium_monthly": {"standard": 60, "hd": 25},
        "premium_yearly": {"standard": 60, "hd": 25},
    }
    
    if user.subscription_type and user.subscription_expires > datetime.utcnow():
        limits = subscription_limits.get(user.subscription_type, {"standard": 0, "hd": 0})
        return {
            "remaining_today_standard": max(0, limits["standard"] - user.daily_standard_used),
            "remaining_today_hd": max(0, limits["hd"] - user.daily_hd_used)
        }
    
    return {
        "remaining_today_standard": 0,
        "remaining_today_hd": 0
    }

async def enhance_image_with_gemini(image_data: bytes, mode: str = "enhance") -> bytes:
    """Enhance image using the Nano Banana AI enhancement pipeline"""
    
    if not image_enhancer:
        raise HTTPException(status_code=503, detail="Image enhancement service not available")
    
    # Use the advanced image enhancer - let exceptions bubble up
    enhanced_data = await image_enhancer.enhance(image_data, resolution, mode)
    return enhanced_data

class EnhanceRequest(BaseModel):
    user_id: str
    mode: str = "enhance"

@app.post("/api/enhance")
async def enhance_image(
    request: EnhanceRequest,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = get_or_create_user(db, request.user_id)
    
    # Check if user has credits before processing
    daily_limits = check_daily_limits(user)
    
    has_credits = user.standard_credits > 0 or daily_limits["remaining_today_standard"] > 0
    if not has_credits:
        raise HTTPException(status_code=403, detail="No credits available")
    
    start_time = datetime.utcnow()
    
    # Read the uploaded image
    image_data = await file.read()
    
    try:
        # Try to enhance the image
        enhanced_data = await enhance_image_with_gemini(image_data, request.mode)
        
        # Only deduct credits if enhancement was successful
        if user.standard_credits > 0:
            user.standard_credits -= 1
        elif daily_limits["remaining_today_standard"] > 0:
            user.daily_standard_used += 1
        
        # Save to storage
        file_id = str(uuid.uuid4())
        original_key = f"original/{file_id}.jpg"
        enhanced_key = f"enhanced/{file_id}.jpg"
        
        try:
            minio_client.put_object(
                MINIO_BUCKET,
                original_key,
                io.BytesIO(image_data),
                len(image_data)
            )
            
            minio_client.put_object(
                MINIO_BUCKET,
                enhanced_key,
                io.BytesIO(enhanced_data),
                len(enhanced_data)
            )
        except Exception as e:
            # Refund credits if storage fails
            if user.daily_standard_used > 0:
                user.daily_standard_used -= 1
            else:
                user.standard_credits += 1
            db.commit()
            raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        watermark = user.standard_credits == 0 and user.hd_credits == 0 and \
                   (not user.subscription_type or user.subscription_expires <= datetime.utcnow())
        
        enhancement = Enhancement(
            user_id=request.user_id,
            original_url=original_key,
            enhanced_url=enhanced_key,
            resolution="standard",
            mode=request.mode,
            processing_time=processing_time,
            watermark=watermark
        )
        db.add(enhancement)
        db.commit()
        
        daily_limits = check_daily_limits(user)
        
        return {
            "enhancement_id": enhancement.id,
            "enhanced_url": f"/api/image/{enhanced_key}",
            "watermark": watermark,
            "processing_time": processing_time,
            "remaining_credits": user.standard_credits,
            "remaining_today": daily_limits["remaining_today_standard"]
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Don't deduct credits if enhancement fails
        db.rollback()
        # Return a user-friendly error message
        error_message = str(e)
        if "Gemini enhancement failed" in error_message:
            raise HTTPException(status_code=500, detail=error_message)
        else:
            raise HTTPException(status_code=500, detail=f"Enhancement failed: {error_message}")

@app.get("/api/image/{key:path}")
async def get_image(key: str, thumbnail: bool = False):
    try:
        response = minio_client.get_object(MINIO_BUCKET, key)
        image_data = response.read()
        
        if thumbnail:
            # Generate thumbnail
            img = Image.open(io.BytesIO(image_data))
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Save thumbnail to bytes
            thumb_io = io.BytesIO()
            img.save(thumb_io, format='JPEG', quality=85)
            thumb_io.seek(0)
            
            return StreamingResponse(thumb_io, media_type="image/jpeg")
        else:
            return StreamingResponse(io.BytesIO(image_data), media_type="image/jpeg")
    except S3Error:
        raise HTTPException(status_code=404, detail="Image not found")

class PurchaseRequest(BaseModel):
    user_id: str
    receipt: Dict
    product_id: str
    platform: str

@app.post("/api/purchase")
async def record_purchase(request: PurchaseRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, request.user_id)
    
    product_mapping = {
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
    
    product = product_mapping.get(request.product_id)
    if not product:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    purchase = Purchase(
        user_id=request.user_id,
        receipt=request.receipt,
        product_id=request.product_id,
        platform=request.platform
    )
    db.add(purchase)
    
    if "standard_credits" in product:
        user.standard_credits += product["standard_credits"]
    elif "hd_credits" in product:
        user.hd_credits += product["hd_credits"]
    elif "subscription_type" in product:
        user.subscription_type = product["subscription_type"]
        user.subscription_expires = datetime.utcnow() + timedelta(days=product["days"])
    
    db.commit()
    
    return {
        "success": True,
        "purchase_id": purchase.id,
        "standard_credits": user.standard_credits,
        "hd_credits": user.hd_credits,
        "subscription_type": user.subscription_type,
        "subscription_expires": user.subscription_expires.isoformat() if user.subscription_expires else None
    }

class RestoreRequest(BaseModel):
    user_id: str
    receipts: Optional[List[Dict]] = []

@app.post("/api/restore")
async def restore_purchases(request: RestoreRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, request.user_id)
    
    purchases = db.query(Purchase).filter(Purchase.user_id == request.user_id).all()
    
    return {
        "user_id": user.id,
        "standard_credits": user.standard_credits,
        "hd_credits": user.hd_credits,
        "subscription_type": user.subscription_type,
        "subscription_expires": user.subscription_expires.isoformat() if user.subscription_expires else None,
        "purchases": [
            {
                "purchase_id": p.id,
                "product_id": p.product_id,
                "platform": p.platform,
                "created_at": p.created_at.isoformat()
            }
            for p in purchases
        ]
    }

class AnalyticsRequest(BaseModel):
    user_id: str
    event_type: str
    event_data: Dict
    platform: str = "mobile"
    app_version: str = "1.0.0"

@app.post("/api/analytics")
async def track_analytics(request: AnalyticsRequest, db: Session = Depends(get_db)):
    event = AnalyticsEvent(
        user_id=request.user_id,
        event_type=request.event_type,
        event_data=request.event_data,
        platform=request.platform,
        app_version=request.app_version
    )
    db.add(event)
    db.commit()
    
    return {"success": True, "event_id": event.id}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

class EmailVerificationRequest(BaseModel):
    email: str
    device_id: str
    device_name: str
    device_type: str = "unknown"

@app.post("/api/email/send-verification")
async def send_verification_code(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Send verification code to email for device linking"""
    if not email_service:
        raise HTTPException(status_code=503, detail="Email service not available")
    
    # Check if device is already linked
    existing_device = db.query(LinkedDevice).filter(
        LinkedDevice.device_id == request.device_id
    ).first()
    
    if existing_device:
        return {
            "success": False,
            "message": "Device already linked",
            "linked_email": existing_device.email
        }
    
    # Generate verification code
    code = email_service.generate_verification_code()
    
    # Create verification record
    verification = EmailVerification(
        email=request.email,
        device_id=request.device_id,
        device_name=request.device_name,
        verification_code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(verification)
    db.commit()
    
    # Send email
    sent = await email_service.send_verification_email(
        request.email, 
        code, 
        request.device_name
    )
    
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return {
        "success": True,
        "message": "Verification code sent",
        "expires_in_minutes": 10
    }

class VerifyCodeRequest(BaseModel):
    email: str
    device_id: str
    code: str
    device_type: str = "unknown"

@app.post("/api/email/verify-code")
async def verify_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db)
):
    """Verify code and link device to email"""
    
    # Find valid verification
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == request.email,
        EmailVerification.device_id == request.device_id,
        EmailVerification.verification_code == request.code,
        EmailVerification.verified == False,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    # Mark as verified
    verification.verified = True
    
    # Link device
    linked_device = LinkedDevice(
        email=request.email,
        device_id=request.device_id,
        device_name=verification.device_name,
        device_type=request.device_type
    )
    db.add(linked_device)
    
    # Migrate user data if exists
    user = db.query(User).filter(User.id == request.device_id).first()
    if user:
        # Update user metadata with email
        if not user.user_metadata:
            user.user_metadata = {}
        user.user_metadata["email"] = request.email
    
    db.commit()
    
    return {
        "success": True,
        "message": "Device linked successfully",
        "device_id": request.device_id,
        "email": request.email
    }

@app.get("/api/email/devices/{email}")
async def get_linked_devices(
    email: str,
    db: Session = Depends(get_db)
):
    """Get all devices linked to an email"""
    devices = db.query(LinkedDevice).filter(
        LinkedDevice.email == email
    ).order_by(LinkedDevice.linked_at.desc()).all()
    
    return {
        "email": email,
        "devices": [
            {
                "device_id": d.device_id,
                "device_name": d.device_name,
                "device_type": d.device_type,
                "linked_at": d.linked_at.isoformat(),
                "last_active": d.last_active.isoformat()
            }
            for d in devices
        ]
    }

class RemoveDeviceRequest(BaseModel):
    email: str
    device_id_to_remove: str
    requesting_device_id: str

@app.post("/api/email/remove-device")
async def remove_device(
    request: RemoveDeviceRequest,
    db: Session = Depends(get_db)
):
    """Remove a device from email linking"""
    
    # Verify requesting device is linked to this email
    requesting_device = db.query(LinkedDevice).filter(
        LinkedDevice.device_id == request.requesting_device_id,
        LinkedDevice.email == request.email
    ).first()
    
    if not requesting_device:
        raise HTTPException(status_code=403, detail="Requesting device not authorized")
    
    # Find and remove the device
    device_to_remove = db.query(LinkedDevice).filter(
        LinkedDevice.device_id == request.device_id_to_remove,
        LinkedDevice.email == request.email
    ).first()
    
    if not device_to_remove:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device_name = device_to_remove.device_name
    db.delete(device_to_remove)
    db.commit()
    
    # Send notification email
    if email_service:
        await email_service.send_device_removed_email(request.email, device_name)
    
    return {
        "success": True,
        "message": "Device removed successfully",
        "removed_device_id": request.device_id_to_remove
    }

@app.get("/api/sync/history/{email}")
async def get_synced_history(
    email: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get enhancement history for all devices linked to an email"""
    
    # Get all device IDs linked to this email
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
    
    # Get enhancements from all linked devices
    enhancements = db.query(Enhancement).filter(
        Enhancement.user_id.in_(device_ids)
    ).order_by(
        Enhancement.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    # Convert to response format
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

@app.get("/api/enhancements/{user_id}")
async def get_user_enhancements(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get enhancement history for a user"""
    enhancements = db.query(Enhancement).filter(
        Enhancement.user_id == user_id
    ).order_by(
        Enhancement.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    # Convert to response format
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

@app.get("/debug/admin-static")
def debug_admin_static():
    """Debug endpoint to check SQLAdmin static file configuration"""
    import sqladmin
    import os
    
    debug_info = {
        "sqladmin_version": getattr(sqladmin, '__version__', 'Unknown'),
        "sqladmin_location": sqladmin.__file__,
        "sqladmin_directory": os.path.dirname(sqladmin.__file__),
        "current_working_directory": os.getcwd(),
        "routes": [],
        "static_paths_checked": []
    }
    
    # Check routes
    for route in app.routes:
        if hasattr(route, 'path'):
            route_info = {
                "path": route.path,
                "methods": list(route.methods) if hasattr(route, 'methods') else ["MOUNT"],
                "name": getattr(route, 'name', 'unnamed')
            }
            debug_info["routes"].append(route_info)
    
    # Check potential static file locations
    sqladmin_dir = os.path.dirname(sqladmin.__file__)
    potential_paths = [
        os.path.join(sqladmin_dir, 'statics'),
        os.path.join(sqladmin_dir, 'static'),
        os.path.join(sqladmin_dir, 'assets'),
        '/usr/local/lib/python3.11/site-packages/sqladmin/statics',
        '/usr/local/lib/python3.11/site-packages/sqladmin/static',
    ]
    
    for path in potential_paths:
        path_info = {
            "path": path,
            "exists": os.path.exists(path),
            "contents": []
        }
        
        if os.path.exists(path):
            try:
                path_info["contents"] = os.listdir(path)
                # Look for CSS files specifically
                css_files = [f for f in path_info["contents"] if f.endswith('.css')]
                if css_files:
                    path_info["css_files"] = css_files
            except Exception as e:
                path_info["error"] = str(e)
        
        debug_info["static_paths_checked"].append(path_info)
    
    return debug_info