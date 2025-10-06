#!/usr/bin/env python3
"""
Debug script to isolate image corruption issues in the backend pipeline.
This script tests each stage of the image processing pipeline separately.
"""

import io
import sys
import logging
from PIL import Image
import traceback

# Add backend to path
sys.path.append('/app')

from image_enhancement import ImageEnhancer
from app.services.storage_service import StorageService
from app.services.enhancement_service import EnhancementService

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_test_image():
    """Create a simple test image for testing"""
    logger.info("Creating test image...")
    try:
        # Create a simple test image
        img = Image.new('RGB', (512, 512), color='red')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        return img_buffer.getvalue()
    except Exception as e:
        logger.error(f"Failed to create test image: {e}")
        raise

def test_stage_1_image_validation(image_data):
    """Test Stage 1: Image validation and conversion"""
    logger.info("=== Testing Stage 1: Image Validation and Conversion ===")
    try:
        # Test image opening
        img = Image.open(io.BytesIO(image_data))
        logger.info(f"✓ Image opened successfully - format: {img.format}, mode: {img.mode}, size: {img.size}")

        # Test PNG conversion (EnhancementService.convert_to_png)
        enhancement_service = EnhancementService()
        png_data = enhancement_service.convert_to_png(image_data)
        logger.info(f"✓ PNG conversion successful - size: {len(png_data)} bytes")

        # Validate converted image
        converted_img = Image.open(io.BytesIO(png_data))
        logger.info(f"✓ Converted image valid - format: {converted_img.format}, mode: {converted_img.mode}, size: {converted_img.size}")

        return png_data
    except Exception as e:
        logger.error(f"❌ Stage 1 failed: {e}")
        raise

def test_stage_2_gemini_processing(png_data):
    """Test Stage 2: Gemini API processing"""
    logger.info("=== Testing Stage 2: Gemini API Processing ===")
    try:
        enhancer = ImageEnhancer()
        if not enhancer.client:
            logger.warning("⚠️ Gemini client not initialized - skipping Gemini test")
            return None

        logger.info("Calling Gemini API...")
        enhanced_data = enhancer.enhance(png_data, "standard", "enhance")
        logger.info(f"✓ Gemini processing successful - enhanced size: {len(enhanced_data)} bytes")

        # Validate enhanced image
        enhanced_img = Image.open(io.BytesIO(enhanced_data))
        logger.info(f"✓ Enhanced image valid - format: {enhanced_img.format}, mode: {enhanced_img.mode}, size: {enhanced_img.size}")

        return enhanced_data
    except Exception as e:
        logger.error(f"❌ Stage 2 failed: {e}")
        logger.error(traceback.format_exc())
        raise

def test_stage_3_storage_upload(original_data, enhanced_data):
    """Test Stage 3: Storage upload and retrieval"""
    logger.info("=== Testing Stage 3: Storage Upload and Retrieval ===")
    try:
        storage_service = StorageService()

        # Test original upload
        logger.info("Testing original image upload...")
        original_key = storage_service.upload_image(original_data, "original")
        logger.info(f"✓ Original upload successful - key: {original_key}")

        # Test enhanced upload
        logger.info("Testing enhanced image upload...")
        enhanced_key = storage_service.upload_image(enhanced_data, "enhanced")
        logger.info(f"✓ Enhanced upload successful - key: {enhanced_key}")

        # Test retrieval
        logger.info("Testing image retrieval...")
        retrieved_original = storage_service.get_image(original_key)
        retrieved_enhanced = storage_service.get_image(enhanced_key)

        # Data integrity check
        if retrieved_original == original_data:
            logger.info("✓ Original image data integrity verified")
        else:
            logger.error("❌ Original image data integrity failed")

        if retrieved_enhanced == enhanced_data:
            logger.info("✓ Enhanced image data integrity verified")
        else:
            logger.error("❌ Enhanced image data integrity failed")

        return original_key, enhanced_key
    except Exception as e:
        logger.error(f"❌ Stage 3 failed: {e}")
        logger.error(traceback.format_exc())
        raise

def test_stage_4_end_to_end(image_data):
    """Test Stage 4: End-to-end pipeline"""
    logger.info("=== Testing Stage 4: End-to-End Pipeline ===")
    try:
        # This simulates the actual API flow
        enhancement_service = EnhancementService()
        storage_service = StorageService()

        # Step 1: Convert to PNG
        png_data = enhancement_service.convert_to_png(image_data)

        # Step 2: Enhance (skip Gemini if not available, use original for testing)
        try:
            enhanced_data = enhancement_service.enhance_image(png_data, "standard", "enhance")
        except Exception as e:
            logger.warning(f"Gemini enhancement failed, using original for storage test: {e}")
            enhanced_data = png_data

        # Step 3: Upload both
        original_key, enhanced_key = storage_service.upload_original_and_enhanced(png_data, enhanced_data)

        logger.info("✓ End-to-end pipeline test completed")
        return original_key, enhanced_key
    except Exception as e:
        logger.error(f"❌ Stage 4 failed: {e}")
        logger.error(traceback.format_exc())
        raise

def main():
    """Main test function"""
    logger.info("Starting image corruption debug test...")

    try:
        # Stage 1: Create test image and validate
        test_image = create_test_image()
        png_data = test_stage_1_image_validation(test_image)

        # Stage 2: Test Gemini processing (may fail if no API key)
        enhanced_data = test_stage_2_gemini_processing(png_data)
        if enhanced_data is None:
            logger.warning("Using original data for storage tests (Gemini not available)")
            enhanced_data = png_data

        # Stage 3: Test storage upload/retrieval
        original_key, enhanced_key = test_stage_3_storage_upload(png_data, enhanced_data)

        # Stage 4: Test end-to-end pipeline
        final_original_key, final_enhanced_key = test_stage_4_end_to_end(test_image)

        logger.info("🎉 All tests completed successfully!")
        logger.info(f"Final image keys:")
        logger.info(f"  Original: {final_original_key}")
        logger.info(f"  Enhanced: {final_enhanced_key}")

    except Exception as e:
        logger.error(f"💥 Test failed: {e}")
        logger.error(traceback.format_exc())
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())