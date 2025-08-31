import io
import base64
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
from typing import Tuple
import google.generativeai as genai

class ImageEnhancer:
    """Advanced image enhancement using Gemini AI guidance"""
    
    def __init__(self, gemini_model):
        self.gemini_model = gemini_model
    
    async def enhance(self, image_data: bytes, resolution: str) -> bytes:
        """
        Enhance image using AI-guided adjustments
        """
        # Open image
        img = Image.open(io.BytesIO(image_data))
        
        # Determine target size
        target_size = (2048, 2048) if resolution == "hd" else (1024, 1024)
        
        # Resize while maintaining aspect ratio
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get AI guidance if model is available
        if self.gemini_model:
            try:
                enhancements = await self._get_ai_guidance(img)
                img = self._apply_enhancements(img, enhancements)
            except Exception as e:
                print(f"AI guidance failed, applying default enhancements: {e}")
                img = self._apply_default_enhancements(img)
        else:
            img = self._apply_default_enhancements(img)
        
        # Save enhanced image
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=95, optimize=True)
        output.seek(0)
        
        return output.getvalue()
    
    async def _get_ai_guidance(self, img: Image.Image) -> dict:
        """Get enhancement recommendations from Gemini"""
        
        prompt = """
        Analyze this photo and provide specific enhancement parameters in JSON format.
        Consider the image quality, lighting, colors, and any visible defects.
        
        Return ONLY a JSON object with these numeric values (0.5-2.0 range unless specified):
        {
            "brightness": 1.0,      // 0.5-2.0, where 1.0 is no change
            "contrast": 1.0,        // 0.5-2.0, where 1.0 is no change
            "color_saturation": 1.0,// 0.5-2.0, where 1.0 is no change
            "sharpness": 1.0,       // 0.5-2.0, where 1.0 is no change
            "denoise": false,       // true if image is noisy
            "auto_color": false     // true if colors need correction
        }
        """
        
        try:
            import asyncio
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                [prompt, img]
            )
            
            # Parse JSON from response
            import json
            response_text = response.text.strip()
            # Extract JSON if wrapped in markdown
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            return json.loads(response_text)
        except Exception as e:
            print(f"Failed to parse AI guidance: {e}")
            # Return default values
            return {
                "brightness": 1.1,
                "contrast": 1.1,
                "color_saturation": 1.1,
                "sharpness": 1.2,
                "denoise": True,
                "auto_color": True
            }
    
    def _apply_enhancements(self, img: Image.Image, params: dict) -> Image.Image:
        """Apply AI-recommended enhancements"""
        
        # Brightness adjustment
        if params.get("brightness", 1.0) != 1.0:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(params["brightness"])
        
        # Contrast adjustment
        if params.get("contrast", 1.0) != 1.0:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(params["contrast"])
        
        # Color saturation
        if params.get("color_saturation", 1.0) != 1.0:
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(params["color_saturation"])
        
        # Sharpness
        if params.get("sharpness", 1.0) != 1.0:
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(params["sharpness"])
        
        # Denoise
        if params.get("denoise", False):
            img = img.filter(ImageFilter.MedianFilter(size=3))
        
        # Auto color correction
        if params.get("auto_color", False):
            img = self._auto_color_correct(img)
        
        return img
    
    def _apply_default_enhancements(self, img: Image.Image) -> Image.Image:
        """Apply default enhancement pipeline"""
        
        # Slight brightness boost
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.1)
        
        # Increase contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)
        
        # Boost colors slightly
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.1)
        
        # Sharpen
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.2)
        
        # Reduce noise
        img = img.filter(ImageFilter.MedianFilter(size=3))
        
        return img
    
    def _auto_color_correct(self, img: Image.Image) -> Image.Image:
        """Simple auto color correction"""
        # Convert to numpy array
        img_array = np.array(img)
        
        # Apply histogram equalization per channel
        for i in range(3):  # RGB channels
            channel = img_array[:, :, i]
            # Simple contrast stretching
            p2, p98 = np.percentile(channel, (2, 98))
            channel_scaled = np.clip((channel - p2) * 255.0 / (p98 - p2), 0, 255)
            img_array[:, :, i] = channel_scaled.astype(np.uint8)
        
        return Image.fromarray(img_array)