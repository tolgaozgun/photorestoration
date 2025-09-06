import io
import base64
from PIL import Image
from typing import Optional
import os
from google import genai
from google.genai import types


class ImageEnhancer:
    """Image enhancement using Gemini's nano-banana model"""
    
    def __init__(self):
        self.client = None
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
            self.model = "gemini-2.5-flash-image-preview"
    
    async def enhance(self, image_data: bytes, resolution: str, mode: str = "enhance") -> bytes:
        """
        Enhance image using Gemini's image generation model
        """
        try:
            if not self.client:
                raise Exception("Gemini client not initialized")
            
            # Open and prepare image
            img = Image.open(io.BytesIO(image_data))
            
            # Determine target size
            target_size = (2048, 2048) if resolution == "hd" else (1024, 1024)
            
            # Resize while maintaining aspect ratio
            img.thumbnail(target_size, Image.Resampling.LANCZOS)
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Get the appropriate prompt for the mode
            prompt = self._get_prompt_for_mode(mode)
            
            # Generate enhanced image using the correct API pattern
            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt, img],
            )
            
            # Extract the enhanced image from response
            enhanced_data = None
            
            if response.candidates and response.candidates[0].content:
                for part in response.candidates[0].content.parts:
                    if part.inline_data is not None:
                        enhanced_data = part.inline_data.data
                        break
            
            if enhanced_data is None:
                raise Exception("No image data received from Gemini")
            
            return enhanced_data
                
        except Exception as e:
            # Re-raise the exception to be handled by the API endpoint
            raise Exception(f"Gemini enhancement failed: {str(e)}")
    
    def _get_prompt_for_mode(self, mode: str) -> str:
        """Get the appropriate prompt based on the enhancement mode"""
        
        mode_prompts = {
            "enhance": "Take this old photograph and enhance it while preserving authenticity. Remove blur, sharpen the details of faces, clothing, and background objects. Increase clarity in textures like skin, hair, and fabric. Do not invent unrealistic elements—stay faithful to the original content. The result should look like a naturally sharp, high-quality version of the same photo, not artificial or overly smoothed.",
            
            "colorize": "Convert this black-and-white or faded photograph into a natural color version. Apply realistic skin tones, fabric colors, and environmental hues that match the time period and context. Enhance contrast while keeping a soft, authentic look. The goal is to bring memories to life with believable, emotionally resonant colors, while preserving all original details and atmosphere.",
            
            "de-scratch": "Restore this aged photograph by removing scratches, dust, stains, and visible damage. Reconstruct missing areas in a way that blends seamlessly with the original textures. Preserve fine details such as facial features, clothing folds, and background objects. The result should look clean and intact, as if the photo was never scratched, but without altering the composition or style.",
            
            "enlighten": "Correct the lighting of this photo to achieve a balanced, well-lit result. Adjust brightness, contrast, and exposure so that subjects are clearly visible. Fix underexposed or overexposed areas without losing detail. Maintain natural shadows and highlights. Do not oversaturate or alter colors significantly—focus on achieving even, realistic lighting that enhances the photo's clarity.",
            
            "recreate": "Recreate this heavily damaged photograph by reconstructing missing or unclear areas, while preserving the original subjects, poses, and point of view. Do not change the composition, clothing, or facial expressions. The goal is to restore the portrait to what it originally looked like—same people, same positioning, same perspective—without inventing new elements or altering the style. The output should feel like a faithful restoration of the exact same image, only repaired.",
            
            "combine": "Take the provided photos of different people (ancestors, relatives, or acquaintances) and merge them into a single, unified group photograph. Ensure the faces, clothing, and body proportions remain faithful to the original input images. Arrange the people naturally as if they were photographed together in the same scene, with consistent lighting, shadows, and perspective. Blend styles so the final photo looks authentic and seamless, as though it was taken at one time and place. Do not alter facial features or invent new people—only harmonize the given ones."
        }
        
        return mode_prompts.get(mode, mode_prompts["enhance"])