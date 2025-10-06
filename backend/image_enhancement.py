import io
import base64
import logging
from PIL import Image
from typing import Optional
import os
from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class ImageEnhancer:
    """Image enhancement using Gemini's nano-banana model"""
    
    def __init__(self):
        self.client = None
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
            self.model = "gemini-2.5-flash-image-preview"
    
    async def enhance(self, image_data: bytes, resolution: str, mode: str = "enhance", filter_type: Optional[str] = None, custom_prompt: Optional[str] = None) -> bytes:
        """
        Enhance image using Gemini's image generation model
        """
        try:
            logger.info(f"Starting image enhancement - Mode: {mode}, Resolution: {resolution}, Filter: {filter_type}")
            logger.debug(f"Input image size: {len(image_data)} bytes")

            if not self.client:
                raise Exception("Gemini client not initialized")

            # Open and prepare image
            img = Image.open(io.BytesIO(image_data))
            logger.info(f"Original image format: {img.format}, mode: {img.mode}, size: {img.size}")

            # Determine target size
            target_size = (2048, 2048) if resolution == "hd" else (1024, 1024)
            logger.debug(f"Target size: {target_size}")

            # Resize while maintaining aspect ratio
            img.thumbnail(target_size, Image.Resampling.LANCZOS)
            logger.debug(f"Resized image size: {img.size}")

            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
                logger.debug(f"Converted to RGB mode")

            # Get the appropriate prompt for the mode, filter, or custom edit
            if mode == "filter" and filter_type:
                prompt = self._get_filter_prompt(filter_type)
            elif mode == "custom-edit" and custom_prompt:
                prompt = self._get_custom_edit_prompt(custom_prompt)
            else:
                prompt = self._get_prompt_for_mode(mode)

            logger.debug(f"Using prompt: {prompt[:100]}...")

            # Generate enhanced image using the correct API pattern
            logger.info("Calling Gemini API...")
            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt, img],
            )
            logger.info("Gemini API call completed")

            # Extract the enhanced image from response
            enhanced_data = None

            if response.candidates and response.candidates[0].content:
                logger.debug(f"Response has {len(response.candidates[0].content.parts)} parts")
                for i, part in enumerate(response.candidates[0].content.parts):
                    logger.debug(f"Part {i}: has inline_data: {part.inline_data is not None}")
                    if part.inline_data is not None:
                        enhanced_data = part.inline_data.data
                        logger.info(f"Found enhanced image data: {len(enhanced_data)} bytes")
                        logger.debug(f"Enhanced data first 100 bytes: {enhanced_data[:100]}")

                        # Check if data is base64-encoded (starts with valid base64 chars instead of PNG header)
                        if isinstance(enhanced_data, (str, bytes)):
                            # Convert to string if bytes
                            data_str = enhanced_data.decode('utf-8') if isinstance(enhanced_data, bytes) else enhanced_data

                            # Check if it looks like base64 (doesn't start with PNG binary header)
                            if not (isinstance(enhanced_data, bytes) and enhanced_data[:4] == b'\x89PNG'):
                                logger.info("Detected base64-encoded image data, decoding...")
                                try:
                                    enhanced_data = base64.b64decode(data_str)
                                    logger.info(f"Successfully decoded base64 data: {len(enhanced_data)} bytes")
                                    logger.debug(f"Decoded data first 20 bytes: {enhanced_data[:20]}")
                                except Exception as decode_error:
                                    logger.error(f"Failed to decode base64 data: {decode_error}")
                                    raise Exception(f"Failed to decode base64 image data: {decode_error}")

                        break
            else:
                logger.warning("No candidates or content in response")

            if enhanced_data is None:
                logger.error("No image data received from Gemini")
                raise Exception("No image data received from Gemini")

            # Validate the enhanced image data
            try:
                test_img = Image.open(io.BytesIO(enhanced_data))
                logger.info(f"Enhanced image validation successful - format: {test_img.format}, mode: {test_img.mode}, size: {test_img.size}")
            except Exception as img_error:
                logger.error(f"Enhanced image validation failed: {img_error}")
                logger.error(f"Data type: {type(enhanced_data)}, Length: {len(enhanced_data)}, First 100 bytes: {enhanced_data[:100]}")
                raise Exception(f"Enhanced image data is corrupted: {img_error}")

            logger.info("Image enhancement completed successfully")
            return enhanced_data

        except Exception as e:
            logger.error(f"Gemini enhancement failed: {str(e)}", exc_info=True)
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

    def _get_filter_prompt(self, filter_type: str) -> str:
        """Get the appropriate prompt based on the filter type"""

        filter_prompts = {
            "3d-photos": "Transform this photograph into a stunning 3D rendered version while maintaining all original facial features and details. Apply realistic depth, lighting, and dimensional effects to make it appear as a high-quality 3D rendering. Keep all people, clothing, and background elements intact but give them a three-dimensional appearance with proper shadows and depth perception.",

            "muscles": "Enhance the muscle definition and body tone in this photograph naturally and realistically. Improve the definition of arms, chest, abs, and other muscle groups while maintaining natural proportions and skin texture. Do not create unrealistic or exaggerated muscles - focus on bringing out existing muscle tone in a believable way that looks like the person has been working out consistently.",

            "flash": "Apply a dynamic flash photography effect to this image, creating dramatic lighting with strong highlights and defined shadows. Enhance the contrast and make colors more vibrant and saturated. The result should look like a professional flash photograph taken in ideal lighting conditions, with crisp details and a slight glossy finish.",

            "fairy-toon": "Transform this photograph into a whimsical fairy-tale cartoon style while preserving the person's recognizable features. Apply soft, dreamy colors with a magical atmosphere. Add subtle fantasy elements like sparkles or soft glows, but keep the original composition and facial structure intact. The style should be enchanting and cartoon-like but still clearly recognizable as the original person.",

            "90s-anime": "Convert this photograph into a 1990s anime art style while maintaining the person's distinctive facial features and expression. Apply the characteristic large eyes, defined facial contours, and vibrant colors typical of 90s anime. Keep the original pose and composition but render it in the classic hand-drawn anime aesthetic with clean lines and cel-shading effects.",

            "chibi": "Transform this photograph into an adorable chibi anime style with cute, oversized head proportions and large expressive eyes. Maintain the person's recognizable features but make them super cute and kawaii. Use soft, pastel colors and give the character a sweet, innocent expression. The style should be endearing and child-like while keeping the person identifiable.",

            "pixel": "Convert this photograph into a detailed pixel art style reminiscent of 16-bit video games. Use a limited color palette and create clear pixel boundaries while maintaining the recognizability of the person. The result should look like a high-quality sprite from a classic video game, with defined pixel blocks and retro gaming aesthetics.",

            "animal-toon": "Transform this person into a cute anthropomorphic animal character while keeping their facial structure and expression recognizable. Choose an appropriate animal that matches their features (cat, dog, fox, etc.) and apply cartoon styling with soft fur textures and big expressive eyes. The character should be adorable and friendly while maintaining the person's essence.",

            "animated": "Convert this photograph into a high-quality animated movie character style similar to Pixar or Disney animation. Maintain the person's facial features and expression but apply the characteristic smooth, polished 3D animation look with perfect lighting and vibrant colors. The result should look like a professional animated film character.",

            "caricature": "Create a playful caricature of this person by gently exaggerating their most distinctive facial features while keeping it flattering and recognizable. Enhance unique characteristics like smile, eyes, or hair in a fun, cartoon-like way. The style should be humorous but kind, emphasizing personality traits through artistic exaggeration.",

            "mini-toys": "Transform this person into an adorable miniature toy figure style, like a collectible figurine or action figure. Apply a smooth, plastic-like texture with bright, vivid colors and perfect proportions. The result should look like a high-quality toy version of the person that you might find in a store display case.",

            "doll": "Convert this photograph into a beautiful porcelain doll aesthetic while preserving the person's facial features. Apply smooth, flawless skin with a subtle glossy finish, perfectly styled hair, and dress them in elegant doll-like clothing. The eyes should be particularly striking and doll-like, with long lashes and a gentle expression."
        }

        return filter_prompts.get(filter_type, filter_prompts["3d-photos"])

    def _get_custom_edit_prompt(self, user_description: str) -> str:
        """Generate a prompt for custom edits based on user's natural language description"""

        base_prompt = f"""Apply the following custom edit to this photograph: "{user_description}"

Follow these guidelines:
1. Preserve the person's identity and recognizable facial features
2. Make realistic and natural-looking changes
3. Maintain high image quality and proper lighting
4. Keep the original composition and pose unless specifically requested to change
5. Apply the edit in a professional, polished way
6. If the request involves changing colors, skin tone, or lighting, make it look natural
7. If adding or removing elements, blend them seamlessly with the existing photo
8. Do not create unrealistic or impossible changes

The result should look like a professionally edited photograph that fulfills the user's request while maintaining authenticity and visual quality."""

        return base_prompt