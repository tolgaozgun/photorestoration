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
    
    async def enhance(self, image_data: bytes, resolution: str, mode: str = "enhance") -> bytes:
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
                enhancements = await self._get_ai_guidance(img, mode)
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
    
    async def _get_ai_guidance(self, img: Image.Image, mode: str) -> dict:
        """Get enhancement recommendations from Gemini based on mode"""
        
        mode_prompts = {
            "enhance": """
            Analyze this photo and provide specific enhancement parameters to remove blur, sharpen, and add details.
            Focus on improving clarity, sharpness, and overall detail enhancement.
            
            Return ONLY a JSON object with these numeric values:
            {
                "brightness": 1.0,      // 0.5-2.0, adjust if needed for clarity
                "contrast": 1.2,        // 0.5-2.0, increase for better detail
                "color_saturation": 1.0,// 0.5-2.0, maintain natural colors
                "sharpness": 1.5,       // 0.5-2.0, higher for detail enhancement
                "denoise": true,        // true to reduce blur/noise
                "auto_color": false     // only if colors are severely distorted
            }
            """,
            
            "colorize": """
            Analyze this black and white or faded color photo for colorization.
            Provide parameters to add vibrant, realistic colors to memories.
            
            Return ONLY a JSON object with these numeric values:
            {
                "brightness": 1.1,      // 0.5-2.0, slight boost for vibrancy
                "contrast": 1.1,        // 0.5-2.0, enhance depth
                "color_saturation": 1.8,// 0.5-2.0, high to add color
                "sharpness": 1.1,       // 0.5-2.0, mild sharpening
                "denoise": false,       // avoid over-processing
                "auto_color": true      // true to add/correct colors
            }
            """,
            
            "de-scratch": """
            Analyze this photo for scratches, dirt, and physical damage.
            Provide parameters to remove scratches and dirt while preserving detail.
            
            Return ONLY a JSON object with these numeric values:
            {
                "brightness": 1.0,      // 0.5-2.0, maintain original
                "contrast": 1.0,        // 0.5-2.0, maintain original
                "color_saturation": 1.0,// 0.5-2.0, maintain original
                "sharpness": 1.3,       // 0.5-2.0, compensate for smoothing
                "denoise": true,        // true to remove artifacts
                "auto_color": false     // only if damage affected colors
            }
            """,
            
            "enlighten": """
            Analyze this photo for lighting issues, shadows, and exposure problems.
            Provide parameters to correct lighting and bring out hidden details.
            
            Return ONLY a JSON object with these numeric values:
            {
                "brightness": 1.3,      // 0.5-2.0, increase for dark areas
                "contrast": 0.9,        // 0.5-2.0, reduce to reveal shadows
                "color_saturation": 1.1,// 0.5-2.0, slight boost
                "sharpness": 1.1,       // 0.5-2.0, mild enhancement
                "denoise": false,       // preserve detail in shadows
                "auto_color": true      // correct color cast from lighting
            }
            """,
            
            "recreate": """
            Analyze this severely damaged portrait for recreation.
            Provide conservative parameters to recreate while staying true to original.
            
            Return ONLY a JSON object with these numeric values:
            {
                "brightness": 1.1,      // 0.5-2.0, gentle adjustment
                "contrast": 1.1,        // 0.5-2.0, mild enhancement
                "color_saturation": 1.0,// 0.5-2.0, preserve original tones
                "sharpness": 1.4,       // 0.5-2.0, reconstruct details
                "denoise": true,        // true to clean damage
                "auto_color": true      // restore original colors
            }
            """,
            
            "combine": """
            Analyze this photo for combining with other photos.
            Provide balanced parameters for consistent appearance across merged photos.
            
            Return ONLY a JSON object with these numeric values:
            {
                "brightness": 1.0,      // 0.5-2.0, neutral for matching
                "contrast": 1.0,        // 0.5-2.0, neutral for matching
                "color_saturation": 1.0,// 0.5-2.0, neutral for matching
                "sharpness": 1.2,       // 0.5-2.0, ensure clarity
                "denoise": false,       // preserve original quality
                "auto_color": false     // maintain original colors
            }
            """
        }
        
        prompt = mode_prompts.get(mode, mode_prompts["enhance"])
        
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