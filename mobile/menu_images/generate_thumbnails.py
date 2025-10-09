import os
from PIL import Image, ImageDraw, ImageFont
import io

# This script is ready to be connected to the Gemini API.
# By default, it generates local placeholder images.
# To use the real API, follow the instructions in the `generate_image` function.

def get_image_generation_prompt(title, key):
    """Creates a detailed and specific prompt for the image generation model."""
    
    prompts = {
        "futureBaby": "A heartwarming, photorealistic image of a young, happy couple looking down lovingly at a generated image of their future baby on a smartphone. The baby on the phone screen is smiling and looks like a perfect blend of the two parents. The background is a cozy, sunlit living room. The overall feeling is one of joy, love, and excitement.",
        "digitalTwin": "A vibrant, futuristic image of a person's face half-realistic and half-digital avatar, showing a seamless transition. The avatar side has glowing neon lines and a slightly stylized, game-like appearance. The person is looking at the camera with a confident smile. The background is a dark, abstract digital landscape. The image should feel modern, cool, and high-tech.",
        "professionalHeadshots": "A professional and clean headshot of a smiling, confident person in business attire. The lighting is soft and flattering, and the background is a modern, slightly blurred office setting. The person looks directly at the camera, appearing approachable and successful. The image should convey competence and professionalism.",
        "vintagePortraits": "An elegant, vintage-style portrait of a person dressed in classic 1920s attire (flapper dress or a suit with a fedora). The photo has a warm, sepia tone and a soft focus, reminiscent of old film. The person is posing gracefully, looking slightly away from the camera with a nostalgic expression. The mood is classic, stylish, and timeless.",
        "fantasyCharacters": "An epic and imaginative fantasy scene where a person is transformed into a heroic knight in shining armor, holding a glowing sword. The background is a dramatic landscape with a castle and a dragon flying in the distance. The lighting is magical and cinematic. The image should feel adventurous, powerful, and straight out of a fantasy movie.",
        "animateOldPhotos": "A magical and touching before-and-after image. On one side, a static, black-and-white old family photograph. On the other side, the same photo is now in color and subtly animated, with a person in the photo blinking and smiling. A gentle, glowing light effect connects the two halves. The feeling is one of nostalgia and wonder.",
        "cinemagraphs": "A beautiful and serene cinemagraph of a person sitting by a lake. The person is still, but the water in the lake has a subtle, looping motion, and their hair is gently blowing in the wind. The colors are rich and vibrant, and the scene is peaceful and mesmerizing. The image should be captivating and calming.",
        "portraitAnimation": "A close-up portrait of a person's face that is animated to show a range of expressions. The image could be a short, looping video or a still that implies motion, showing the person transitioning from a neutral expression to a happy smile, and maybe a wink. The animation is smooth and realistic. The image should feel lively, expressive, and fun.",
        "backgroundAnimation": "A stunning image of a person standing on a balcony, looking out at a cityscape. The person is static, but the background is a dynamic time-lapse of the sky changing from a beautiful sunset to a starry night with city lights twinkling. The effect is visually striking and dynamic.",
        "3dPhotos": "A dynamic and eye-catching 3D photo effect. A person is jumping in the air, and the image has a clear sense of depth, with the person appearing to pop out of the screen. There are subtle parallax effects in the background. The image should feel energetic, immersive, and three-dimensional.",
        "muscles": "An impressive and motivational image of a person flexing their arm, with a before-and-after effect showing a significant increase in muscle definition. The 'after' side has a subtle, powerful glow. The person looks strong and proud. The image should be inspiring and convey a sense of strength and transformation.",
        "flash": "A dramatic and stylish portrait of a person taken with a bright, direct camera flash. The shadows are harsh and create a high-contrast, edgy look. The person has a cool, confident expression. The style is similar to modern fashion photography. The image should feel bold and trendy.",
        "fairyToon": "A whimsical and enchanting cartoon-style image of a person transformed into a fairy. They have delicate, glowing wings and are surrounded by a magical, sparkling forest. The art style is cute and colorful, like a modern animated movie. The image should be magical, dreamy, and charming.",
        "nineties": "A nostalgic, 90s anime-style drawing of a person. The art style has the characteristic large, expressive eyes, and a slightly grainy, retro feel. The colors are vibrant but have a slightly faded, vintage look. The person is in a dynamic, classic anime pose. The image should evoke a sense of nostalgia for 90s cartoons.",
        "chibi": "An adorable and cute 'chibi' style drawing of a person. They have a large head, small body, and big, sparkling eyes. The character is in a playful, fun pose, maybe giving a peace sign. The colors are bright and cheerful. The image should be irresistibly cute and fun.",
        "pixel": "A retro and cool pixel art version of a person's portrait. The style is reminiscent of 16-bit video games. The details are simplified into pixels, but the person is still recognizable. The background is a simple, pixelated pattern. The image should feel nostalgic, geeky, and stylish.",
        "animalToon": "A fun and playful cartoon image where a person's face is blended with the features of their favorite animal (e.g., a person with cat ears and whiskers). The style is friendly and cartoonish, like a character from an animated kids' movie. The person-animal hybrid looks happy and mischievous. The image should be humorous and charming.",
        "animated": "A beautifully rendered, animated-style portrait of a person, as if they were a character in a modern 3D animated film. The features are slightly stylized, the skin is smooth, and the eyes are expressive. The lighting is soft and cinematic. The image should look like a high-quality animation still.",
        "caricature": "A funny and exaggerated caricature of a person's face. The prominent features are humorously emphasized (e.g., a big smile, expressive eyes). The style is hand-drawn and playful. The image should be lighthearted, amusing, and full of personality.",
        "miniToys": "A creative and fun image where a person is transformed into a small, plastic toy figure. They are standing on a wooden table, next to other everyday objects that now look huge in comparison. The lighting and texture make the person look like a real toy. The image should be imaginative and playful.",
        "doll": "A beautiful and slightly surreal image of a person made to look like a porcelain doll. Their skin is smooth and flawless, their eyes are large and glassy, and they are dressed in an elegant, classic doll-like outfit. The pose is stiff and doll-like. The image should be beautiful, artistic, and slightly uncanny."
    }
    
    return prompts.get(key, f"A vibrant and appealing thumbnail for '{title}'")

def generate_image(prompt, title, api_key):
    print(f"Generating image with prompt: '{prompt}'")
    import google.generativeai as genai
    import base64

    if not api_key:
        print("No API key provided to generate_image")
        return None

    # Use the Client API similar to backend enhancer
    try:
        client = genai.Client(api_key=api_key)
        model_name = "gemini-2.5-flash-image-preview"

        response = client.models.generate_content(
            model=model_name,
            contents=[prompt],
        )

        # Extract image bytes from inline_data
        if getattr(response, "candidates", None):
            first = response.candidates[0]
            content = getattr(first, "content", None)
            if content and getattr(content, "parts", None):
                for part in content.parts:
                    inline = getattr(part, "inline_data", None)
                    if inline and str(getattr(inline, "mime_type", "")).startswith("image/"):
                        data_field = getattr(inline, "data", None)
                        if data_field is None:
                            continue
                        # data may already be bytes; if str, it's base64
                        if isinstance(data_field, bytes):
                            # If it's base64 in bytes, detect PNG header; otherwise try decode
                            if not data_field[:4] == b"\x89PNG":
                                try:
                                    return base64.b64decode(data_field)
                                except Exception:
                                    pass
                            return data_field
                        if isinstance(data_field, str):
                            try:
                                return base64.b64decode(data_field)
                            except Exception:
                                pass
        print("No image data found in response.")
        return None
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        return None


def main():
    """
    Generates thumbnails for the menu items.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("Please set it to your Gemini API key.")
        return

    menu_items = {
        "futureBaby": "Future Baby",
        "digitalTwin": "Digital Twin",
        "professionalHeadshots": "Professional Headshots",
        "vintagePortraits": "Vintage Portraits",
        "fantasyCharacters": "Fantasy Characters",
        "animateOldPhotos": "Animate Old Photos",
        "cinemagraphs": "Cinemagraph Creation",
        "portraitAnimation": "Portrait Animation",
        "backgroundAnimation": "Background Animation",
        "3dPhotos": "3D Photos",
        "muscles": "Muscles",
        "flash": "Flash",
        "fairyToon": "Fairy Toon",
        "nineties": "90s Anime",
        "chibi": "Chibi",
        "pixel": "Pixel",
        "animalToon": "Animal Toon",
        "animated": "Animated",
        "caricature": "Caricature",
        "miniToys": "Mini Toys",
        "doll": "Doll"
    }

    output_dir = os.path.dirname(os.path.abspath(__file__))

    for name, title in menu_items.items():
        prompt = get_image_generation_prompt(title, name)
        image_data = generate_image(prompt, title, api_key)
        
        if image_data:
            file_path = os.path.join(output_dir, f"{name}.png")
            with open(file_path, "wb") as f:
                f.write(image_data)
            print(f"Successfully saved: {file_path}")

if __name__ == "__main__":
    main()