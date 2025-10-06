from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import io
import logging
from PIL import Image
from ..models import get_db
from ..services import EnhancementService, StorageService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/debug/validate-image")
async def validate_image(file: UploadFile = File(...)):
    """
    Debug endpoint to validate an image at each processing stage
    Returns detailed information about the image at each step
    """
    results = {
        "original_file": {},
        "png_conversion": {},
        "gemini_processing": {},
        "storage_upload": {},
        "storage_retrieval": {},
        "errors": []
    }

    try:
        # Stage 1: Read original file
        image_data = await file.read()
        results["original_file"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(image_data),
            "size_kb": round(len(image_data) / 1024, 2)
        }

        try:
            img = Image.open(io.BytesIO(image_data))
            results["original_file"]["format"] = img.format
            results["original_file"]["mode"] = img.mode
            results["original_file"]["dimensions"] = f"{img.width}x{img.height}"
            results["original_file"]["is_valid"] = True
        except Exception as e:
            results["original_file"]["is_valid"] = False
            results["errors"].append(f"Original file validation failed: {str(e)}")
            return JSONResponse(content=results, status_code=200)

        # Stage 2: PNG Conversion
        enhancement_service = EnhancementService()
        try:
            png_data = enhancement_service.convert_to_png(image_data)
            results["png_conversion"]["size_bytes"] = len(png_data)
            results["png_conversion"]["size_kb"] = round(len(png_data) / 1024, 2)

            png_img = Image.open(io.BytesIO(png_data))
            results["png_conversion"]["format"] = png_img.format
            results["png_conversion"]["mode"] = png_img.mode
            results["png_conversion"]["dimensions"] = f"{png_img.width}x{png_img.height}"
            results["png_conversion"]["is_valid"] = True
        except Exception as e:
            results["png_conversion"]["is_valid"] = False
            results["errors"].append(f"PNG conversion failed: {str(e)}")
            return JSONResponse(content=results, status_code=200)

        # Stage 3: Gemini Processing (optional - can be skipped with flag)
        try:
            enhanced_data = await enhancement_service.enhance_image(png_data, "standard", "enhance")
            results["gemini_processing"]["size_bytes"] = len(enhanced_data)
            results["gemini_processing"]["size_kb"] = round(len(enhanced_data) / 1024, 2)

            # Validate enhanced image
            enhanced_img = Image.open(io.BytesIO(enhanced_data))
            results["gemini_processing"]["format"] = enhanced_img.format
            results["gemini_processing"]["mode"] = enhanced_img.mode
            results["gemini_processing"]["dimensions"] = f"{enhanced_img.width}x{enhanced_img.height}"
            results["gemini_processing"]["is_valid"] = True

            # Check if data looks corrupted by comparing headers
            results["gemini_processing"]["first_bytes"] = str(enhanced_data[:20])

        except Exception as e:
            results["gemini_processing"]["is_valid"] = False
            results["errors"].append(f"Gemini processing failed: {str(e)}")
            # Continue to test storage with original data
            enhanced_data = png_data

        # Stage 4: Storage Upload
        storage_service = StorageService()
        try:
            # Upload enhanced image
            enhanced_key = storage_service.upload_image(enhanced_data, "debug")
            results["storage_upload"]["key"] = enhanced_key
            results["storage_upload"]["size_bytes"] = len(enhanced_data)
            results["storage_upload"]["is_valid"] = True
        except Exception as e:
            results["storage_upload"]["is_valid"] = False
            results["errors"].append(f"Storage upload failed: {str(e)}")
            return JSONResponse(content=results, status_code=200)

        # Stage 5: Storage Retrieval
        try:
            retrieved_data = storage_service.get_image(enhanced_key)
            results["storage_retrieval"]["size_bytes"] = len(retrieved_data)
            results["storage_retrieval"]["size_kb"] = round(len(retrieved_data) / 1024, 2)

            # Validate retrieved image
            retrieved_img = Image.open(io.BytesIO(retrieved_data))
            results["storage_retrieval"]["format"] = retrieved_img.format
            results["storage_retrieval"]["mode"] = retrieved_img.mode
            results["storage_retrieval"]["dimensions"] = f"{retrieved_img.width}x{retrieved_img.height}"
            results["storage_retrieval"]["is_valid"] = True

            # Data integrity check
            if retrieved_data == enhanced_data:
                results["storage_retrieval"]["data_integrity"] = "PASSED"
            else:
                results["storage_retrieval"]["data_integrity"] = "FAILED"
                results["errors"].append("Data integrity check failed - retrieved data doesn't match uploaded data")

        except Exception as e:
            results["storage_retrieval"]["is_valid"] = False
            results["errors"].append(f"Storage retrieval failed: {str(e)}")

        # Summary
        results["summary"] = {
            "all_stages_valid": len(results["errors"]) == 0,
            "total_errors": len(results["errors"]),
            "corruption_detected": any([
                not results.get("png_conversion", {}).get("is_valid", False),
                not results.get("gemini_processing", {}).get("is_valid", False),
                not results.get("storage_upload", {}).get("is_valid", False),
                not results.get("storage_retrieval", {}).get("is_valid", False),
                results.get("storage_retrieval", {}).get("data_integrity") == "FAILED"
            ])
        }

        return JSONResponse(content=results, status_code=200)

    except Exception as e:
        logger.error(f"Debug validation failed: {e}", exc_info=True)
        results["errors"].append(f"Unexpected error: {str(e)}")
        return JSONResponse(content=results, status_code=500)


@router.get("/debug/test-storage/{key:path}")
async def test_storage_retrieval(key: str):
    """
    Debug endpoint to test retrieving an image from storage and validating it
    """
    storage_service = StorageService()

    try:
        # Retrieve image
        image_data = storage_service.get_image(key)

        # Validate
        img = Image.open(io.BytesIO(image_data))

        return JSONResponse(content={
            "key": key,
            "size_bytes": len(image_data),
            "size_kb": round(len(image_data) / 1024, 2),
            "format": img.format,
            "mode": img.mode,
            "dimensions": f"{img.width}x{img.height}",
            "is_valid": True,
            "first_20_bytes": str(image_data[:20])
        })
    except Exception as e:
        logger.error(f"Storage retrieval test failed for key {key}: {e}", exc_info=True)
        return JSONResponse(content={
            "key": key,
            "is_valid": False,
            "error": str(e)
        }, status_code=500)
