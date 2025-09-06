from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from io import BytesIO
from ..models import get_db, Enhancement
from ..services import UserService, EnhancementService, StorageService
from ..schemas.requests import EnhanceRequest
from ..schemas.responses import EnhancementResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/enhance", response_model=EnhancementResponse)
async def enhance_image(
    user_id: str = Form(...),
    mode: str = Form("enhance"),
    file: UploadFile = File(...),
    resolution: str = Form("standard"),
    db: Session = Depends(get_db)
):
    logger.info(f"Received enhance request: user_id={user_id}, mode={mode}, resolution={resolution}, filename={file.filename}, content_type={file.content_type}")

    try:
        user = UserService.get_or_create_user(db, user_id)
        
        if not UserService.has_credits(user):
            logger.warning(f"User {user_id} has no credits available for enhancement.")
            raise HTTPException(status_code=403, detail="No credits available")
        
        start_time = datetime.utcnow()
        
        image_data = await file.read()
        
        enhancement_service = EnhancementService()
        storage_service = StorageService()
        
        image_data = enhancement_service.convert_to_png(image_data)
        
        logger.info(f"Starting enhancement - User: {user_id}, Mode: {mode}, Resolution: {resolution}, "
                   f"File Size: {len(image_data)/1024:.1f}KB")
        
        try:
            enhanced_data = await enhancement_service.enhance_image(image_data, resolution, mode)
            
            UserService.deduct_credits(user)
            
            try:
                original_key, enhanced_key = storage_service.upload_original_and_enhanced(image_data, enhanced_data)
                logger.info(f"Image saved to storage successfully.")
            except Exception as e:
                logger.error(f"Storage error for user {user_id}, file {file.filename}: {e}", exc_info=True)
                UserService.refund_credits(user)
                db.commit()
                raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            watermark = (
                user.credits == 0 and 
                (not user.subscription_type or user.subscription_expires <= datetime.utcnow())
            )
            
            enhancement = Enhancement(
                user_id=user_id,
                original_url=original_key,
                enhanced_url=enhanced_key,
                resolution=resolution,
                mode=mode,
                processing_time=processing_time,
                watermark=watermark
            )
            db.add(enhancement)
            db.commit()
            
            logger.info(f"Enhancement completed successfully - User: {user_id}, Enhancement ID: {enhancement.id}, "
                       f"Mode: {mode}, Resolution: {resolution}, "
                       f"Processing Time: {processing_time:.2f}s, Watermark: {watermark}, "
                       f"File Size: {len(image_data)/1024:.1f}KB -> {len(enhanced_data)/1024:.1f}KB")
            
            credits_info = UserService.get_credits_info(user)
            
            return EnhancementResponse(
                enhancement_id=enhancement.id,
                enhanced_url=f"/api/image/{enhanced_key}",
                watermark=watermark,
                processing_time=processing_time,
                remaining_credits=credits_info["total_credits"],
                remaining_today=credits_info["remaining_today"]
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Image enhancement failed for user {user_id}, file {file.filename}: {e}", exc_info=True)
            db.rollback()
            error_message = str(e)
            if "Gemini enhancement failed" in error_message:
                raise HTTPException(status_code=500, detail=error_message)
            else:
                raise HTTPException(status_code=500, detail=f"Enhancement failed: {error_message}")
    except Exception as e:
        logger.error(f"Error processing enhance request: {e}", exc_info=True)
        raise HTTPException(status_code=422, detail=f"Invalid request data: {e}")

@router.get("/image/{key:path}")
async def get_image(key: str, thumbnail: bool = False):
    from minio.error import S3Error
    
    storage_service = StorageService()
    
    try:
        image_data = storage_service.get_image(key)
        
        if thumbnail:
            enhancement_service = EnhancementService()
            thumbnail_data = enhancement_service.generate_thumbnail(image_data)
            return StreamingResponse(BytesIO(thumbnail_data), media_type="image/png")
        else:
            return StreamingResponse(BytesIO(image_data), media_type="image/png")
    except S3Error:
        raise HTTPException(status_code=404, detail="Image not found")