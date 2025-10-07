from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from io import BytesIO
from ..models import get_db, Enhancement
from ..services import UserService, EnhancementService, StorageService
from ..schemas.responses import EnhancementResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/custom-edit", response_model=EnhancementResponse)
async def apply_custom_edit(
    user_id: str = Form(...),
    edit_description: str = Form(...),
    file: UploadFile = File(...),
    resolution: str = Form("standard"),
    db: Session = Depends(get_db)
):
    logger.info(f"Received custom edit request: user_id={user_id}, edit_description='{edit_description}', resolution={resolution}, filename={file.filename}, content_type={file.content_type}")

    try:
        user = UserService.get_or_create_user(db, user_id)

        if not UserService.has_credits(user):
            logger.warning(f"User {user_id} has no credits available for custom edit.")
            raise HTTPException(status_code=403, detail="No credits available")

        # Validate edit description
        if not edit_description or len(edit_description.strip()) < 3:
            raise HTTPException(status_code=400, detail="Edit description is required and must be at least 3 characters long")

        if len(edit_description) > 500:
            raise HTTPException(status_code=400, detail="Edit description is too long (max 500 characters)")

        start_time = datetime.utcnow()

        image_data = await file.read()

        enhancement_service = EnhancementService()
        storage_service = StorageService()

        image_data = enhancement_service.convert_to_png(image_data)

        logger.info(f"Starting custom edit - User: {user_id}, Description: '{edit_description}', Resolution: {resolution}, "
                   f"File Size: {len(image_data)/1024:.1f}KB")

        try:
            enhanced_data = await enhancement_service.enhance_image(
                image_data,
                resolution,
                mode="custom-edit",
                custom_prompt=edit_description
            )

            UserService.deduct_credits(user)

            try:
                original_key, enhanced_key = storage_service.upload_original_and_enhanced(image_data, enhanced_data)
                logger.info(f"Custom edit image saved to storage successfully.")
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
                mode="custom-edit",
                processing_time=processing_time,
                watermark=watermark
            )
            db.add(enhancement)
            db.commit()

            logger.info(f"Custom edit completed successfully - User: {user_id}, Enhancement ID: {enhancement.id}, "
                       f"Description: '{edit_description}', Resolution: {resolution}, "
                       f"Processing Time: {processing_time:.2f}s, Watermark: {watermark}, "
                       f"File Size: {len(image_data)/1024:.1f}KB -> {len(enhanced_data)/1024:.1f}KB")

            credits_info = UserService.get_credits_info(user)

            return EnhancementResponse(
                enhancement_id=enhancement.id,
                enhanced_url=storage_service.get_full_url(enhanced_key),
                watermark=watermark,
                processing_time=processing_time,
                remaining_credits=credits_info["total_credits"],
                remaining_today=credits_info["remaining_today"]
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Custom edit failed for user {user_id}, file {file.filename}: {e}", exc_info=True)
            db.rollback()
            error_message = str(e)
            if "Gemini enhancement failed" in error_message:
                raise HTTPException(status_code=500, detail=error_message)
            else:
                raise HTTPException(status_code=500, detail=f"Custom edit failed: {error_message}")
    except Exception as e:
        logger.error(f"Error processing custom edit request: {e}", exc_info=True)
        raise HTTPException(status_code=422, detail=f"Invalid request data: {e}")