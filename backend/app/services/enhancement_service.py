import io
import sys
import logging
from PIL import Image
from fastapi import HTTPException

# Import from backend root directory
sys.path.append('/app')
from image_enhancement import ImageEnhancer

logger = logging.getLogger(__name__)

class EnhancementService:
    def __init__(self):
        self.enhancer = None
        try:
            self.enhancer = ImageEnhancer()
            print("Image enhancer initialized successfully")
        except Exception as e:
            print(f"Warning: Failed to initialize image enhancer: {e}")
    
    async def enhance_image(self, image_data: bytes, resolution: str = "standard", mode: str = "enhance", filter_type: str = None, custom_prompt: str = None) -> bytes:
        logger.info(f"Enhancement service called - mode: {mode}, resolution: {resolution}")

        if not self.enhancer:
            logger.error("Image enhancer not initialized")
            raise HTTPException(status_code=503, detail="Image enhancement service not available")

        # Validate input image
        try:
            test_img = Image.open(io.BytesIO(image_data))
            logger.debug(f"Input image validation successful - format: {test_img.format}, mode: {test_img.mode}, size: {test_img.size}")
        except Exception as e:
            logger.error(f"Input image validation failed: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

        # Convert to PNG format
        try:
            png_data = self.convert_to_png(image_data)
            logger.debug(f"Converted to PNG - original size: {len(image_data)}, PNG size: {len(png_data)}")
        except Exception as e:
            logger.error(f"PNG conversion failed: {e}")
            raise HTTPException(status_code=400, detail=f"Image conversion failed: {e}")

        # Enhance the image
        try:
            enhanced_data = await self.enhancer.enhance(png_data, resolution, mode, filter_type, custom_prompt)
            logger.info(f"Image enhancement completed - enhanced size: {len(enhanced_data)} bytes")
            return enhanced_data
        except Exception as e:
            logger.error(f"Enhancement failed: {e}")
            raise HTTPException(status_code=500, detail=f"Enhancement failed: {e}")
    
    def convert_to_png(self, image_data: bytes) -> bytes:
        try:
            img = Image.open(io.BytesIO(image_data))
            logger.debug(f"Converting image - format: {img.format}, mode: {img.mode}, size: {img.size}")

            if img.format != 'PNG':
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                png_data = img_buffer.getvalue()
                logger.debug(f"Converted to PNG - new size: {len(png_data)} bytes")
                return png_data

            logger.debug("Image already in PNG format")
            return image_data
        except Exception as e:
            logger.error(f"PNG conversion failed: {e}")
            raise Exception(f"PNG conversion failed: {e}")
    
    def generate_thumbnail(self, image_data: bytes, size: tuple[int, int] = (200, 200)) -> bytes:
        img = Image.open(io.BytesIO(image_data))
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='PNG')
        thumb_io.seek(0)
        
        return thumb_io.getvalue()