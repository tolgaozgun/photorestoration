from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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
import google.generativeai as genai
from PIL import Image
import base64
from dotenv import load_dotenv
from image_enhancement import ImageEnhancer

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

Base.metadata.create_all(bind=engine)

minio_client = None
gemini_model = None
image_enhancer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global minio_client, gemini_model, image_enhancer
    
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
    
    # Initialize Gemini
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("Gemini AI model initialized successfully")
    else:
        print("Warning: GOOGLE_API_KEY not set, using basic enhancement")
    
    # Initialize image enhancer
    image_enhancer = ImageEnhancer(gemini_model)
    
    yield
    

app = FastAPI(title="Photo Restoration API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

async def enhance_image_with_gemini(image_data: bytes, resolution: str, mode: str = "enhance") -> bytes:
    """Enhance image using the Nano Banana AI enhancement pipeline"""
    
    if not image_enhancer:
        # Fallback if enhancer not initialized
        await asyncio.sleep(0.5)
        return image_data
    
    try:
        # Use the advanced image enhancer
        enhanced_data = await image_enhancer.enhance(image_data, resolution, mode)
        return enhanced_data
        
    except Exception as e:
        print(f"Image enhancement error: {e}")
        # Return original image on error
        return image_data

class EnhanceRequest(BaseModel):
    user_id: str
    resolution: str = "standard"
    mode: str = "enhance"

@app.post("/api/enhance")
async def enhance_image(
    request: EnhanceRequest,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = get_or_create_user(db, request.user_id)
    
    daily_limits = check_daily_limits(user)
    
    if request.resolution == "hd":
        if user.hd_credits > 0:
            user.hd_credits -= 1
        elif daily_limits["remaining_today_hd"] > 0:
            user.daily_hd_used += 1
        else:
            raise HTTPException(status_code=403, detail="No HD credits available")
    else:
        if user.standard_credits > 0:
            user.standard_credits -= 1
        elif daily_limits["remaining_today_standard"] > 0:
            user.daily_standard_used += 1
        else:
            raise HTTPException(status_code=403, detail="No standard credits available")
    
    start_time = datetime.utcnow()
    
    image_data = await file.read()
    
    enhanced_data = await enhance_image_with_gemini(image_data, request.resolution, request.mode)
    
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
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")
    
    processing_time = (datetime.utcnow() - start_time).total_seconds()
    
    watermark = user.standard_credits == 0 and user.hd_credits == 0 and \
               (not user.subscription_type or user.subscription_expires <= datetime.utcnow())
    
    enhancement = Enhancement(
        user_id=request.user_id,
        original_url=original_key,
        enhanced_url=enhanced_key,
        resolution=request.resolution,
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
        "remaining_standard_credits": user.standard_credits,
        "remaining_hd_credits": user.hd_credits,
        "remaining_today_standard": daily_limits["remaining_today_standard"],
        "remaining_today_hd": daily_limits["remaining_today_hd"]
    }

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