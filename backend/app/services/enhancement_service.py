import io
import sys
from PIL import Image
from fastapi import HTTPException

# Import from backend root directory
sys.path.append('/app')
from image_enhancement import ImageEnhancer

class EnhancementService:
    def __init__(self):
        self.enhancer = None
        try:
            self.enhancer = ImageEnhancer()
            print("Image enhancer initialized successfully")
        except Exception as e:
            print(f"Warning: Failed to initialize image enhancer: {e}")
    
    async def enhance_image(self, image_data: bytes, resolution: str = "standard", mode: str = "enhance", filter_type: str = None, custom_prompt: str = None) -> bytes:
        if not self.enhancer:
            raise HTTPException(status_code=503, detail="Image enhancement service not available")
        
        enhanced_data = await self.enhancer.enhance(image_data, resolution, mode, filter_type, custom_prompt)
        return enhanced_data
    
    def convert_to_png(self, image_data: bytes) -> bytes:
        try:
            img = Image.open(io.BytesIO(image_data))
            if img.format != 'PNG':
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                return img_buffer.getvalue()
            return image_data
        except Exception as e:
            print(f"Could not convert image to PNG: {e}")
            return image_data
    
    def generate_thumbnail(self, image_data: bytes, size: tuple[int, int] = (200, 200)) -> bytes:
        img = Image.open(io.BytesIO(image_data))
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='PNG')
        thumb_io.seek(0)
        
        return thumb_io.getvalue()