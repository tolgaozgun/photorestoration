#!/usr/bin/env python3
"""
Simple Menu Asset Generator using Gemini

This script generates sample HARDCODED_MENU_DATA with image paths and can generate
icons using Gemini's image generation capabilities.

Requirements:
- pip install google-genai
- Set GEMINI_API_KEY environment variable
"""

import base64
import mimetypes
import os
import json
from google import genai
from google.genai import types


def save_binary_file(file_name, data):
    """Save binary data to a file."""
    f = open(file_name, "wb")
    f.write(data)
    f.close()
    print(f"File saved to: {file_name}")


def generate():
    """Generate icons and menu data using Gemini."""

    # Check if API key is set
    if not os.environ.get("GEMINI_API_KEY"):
        print("Error: Please set GEMINI_API_KEY environment variable")
        return

    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.5-flash-image-preview"

    # Create prompt for menu icon generation
    prompt = """Generate a set of modern, clean icons for a photo restoration mobile app menu.

I need icons for the following menu items:

1. "Enhance Photo" - Improve photo quality with AI (magic wand or sparkle effect)
2. "Colorize Photo" - Add color to black & white photos (palette or color droplet)
3. "Remove Scratches" - Fix damaged photos (healing brush or repair tool)
4. "Deblur Photo" - Sharpen blurry images (focus or clarity effect)
5. "Enhance Video" - Improve video quality (film strip with up arrow)
6. "Stabilize Video" - Reduce camera shake (steady hand or gyroscope)
7. "AI Art Generator" - Create artwork from text (brain with art palette)
8. "Style Transfer" - Apply artistic styles (painting transformation)
9. "Background Remover" - Remove image backgrounds (scissors with transparency)
10. "Subscription" - Manage premium subscription (crown or gem)
11. "Settings" - App preferences (gear icon)
12. "Profile" - User profile (person silhouette)
13. "Help & Support" - Get help (question mark in circle)
14. "About" - App information (info symbol)

Requirements:
- 64x64 pixel icons
- Modern, minimalist design
- Consistent color scheme (subtle blues and purples)
- Clean lines and simple shapes
- Transparent background
- PNG format

Please generate each icon as a separate image with a brief description of the design concept.

Return in this format:
Icon: Enhance Photo
Description: [description]
[Image]

Icon: Colorize Photo
Description: [description]
[Image]

And so on for all icons."""

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        response_modalities=[
            "IMAGE",
            "TEXT",
        ],
    )

    file_index = 0
    generated_menu_data = {
        "sections": [],
        "items": [],
        "success": True
    }

    # Create output directory
    os.makedirs("generated_menu_assets", exist_ok=True)

    print("Generating menu icons...")
    print("This may take a few minutes...\n")

    try:
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if (chunk.candidates is None
                or chunk.candidates[0].content is None
                or chunk.candidates[0].content.parts is None):
                continue

            for part in chunk.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    # Save image
                    inline_data = part.inline_data
                    data_buffer = inline_data.data
                    file_extension = mimetypes.guess_extension(inline_data.mime_type)
                    file_name = f"generated_menu_assets/icon_{file_index}{file_extension}"
                    save_binary_file(file_name, data_buffer)
                    file_index += 1
                elif part.text:
                    print(part.text)

        # Generate sample HARDCODED_MENU_DATA
        sample_menu_data = generate_sample_menu_data()

        # Save sample menu data
        with open("generated_menu_assets/HARDCODED_MENU_DATA.json", "w") as f:
            json.dump(sample_menu_data, f, indent=2)

        print(f"\nGenerated {file_index} icons successfully!")
        print("Sample HARDCODED_MENU_DATA saved to: generated_menu_assets/HARDCODED_MENU_DATA.json")

    except Exception as e:
        print(f"Error generating icons: {e}")
        print("Make sure you have the correct API key and internet connection.")


def generate_sample_menu_data():
    """Generate sample HARDCODED_MENU_DATA with image paths."""

    return {
        "sections": [
            {
                "id": "photo-enhancement",
                "name": "photo_enhancement",
                "title": "Photo Enhancement",
                "description": "AI-powered photo restoration and enhancement tools",
                "icon": "📸",
                "layout": "grid",
                "is_active": True,
                "metadata": {
                    "screen": "Menu",
                    "category": "photo"
                }
            },
            {
                "id": "video-enhancement",
                "name": "video_enhancement",
                "title": "Video Enhancement",
                "description": "Advanced video quality improvement features",
                "icon": "🎬",
                "layout": "grid",
                "is_active": True,
                "metadata": {
                    "screen": "Menu",
                    "category": "video"
                }
            },
            {
                "id": "creative-tools",
                "name": "creative_tools",
                "title": "Creative Tools",
                "description": "Transform your media with AI-powered creative effects",
                "icon": "🎨",
                "layout": "grid",
                "is_active": True,
                "metadata": {
                    "screen": "Menu",
                    "category": "creative"
                }
            },
            {
                "id": "account-settings",
                "name": "account_settings",
                "title": "Account & Settings",
                "description": "Manage your account and app preferences",
                "icon": "⚙️",
                "layout": "list",
                "is_active": True,
                "metadata": {
                    "screen": "Menu",
                    "category": "settings"
                }
            }
        ],
        "items": [
            # Photo Enhancement Items
            {
                "id": "enhance-photo",
                "title": "Enhance Photo",
                "description": "Improve photo quality with AI",
                "icon": "✨",
                "imagePath": "generated_menu_assets/icon_0.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "photo-enhancement",
                "sort_order": 1,
                "is_active": True,
                "is_premium": False,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "enhancement",
                    "supported_formats": ["jpg", "jpeg", "png", "webp"],
                    "enhancement_type": "general"
                }
            },
            {
                "id": "colorize-photo",
                "title": "Colorize Photo",
                "description": "Add color to black & white photos",
                "icon": "🎨",
                "imagePath": "generated_menu_assets/icon_1.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "photo-enhancement",
                "sort_order": 2,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "colorization",
                    "supported_formats": ["jpg", "jpeg", "png"],
                    "enhancement_type": "colorization"
                }
            },
            {
                "id": "remove-scratches",
                "title": "Remove Scratches",
                "description": "Fix damaged photos and remove imperfections",
                "icon": "🔧",
                "imagePath": "generated_menu_assets/icon_2.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "photo-enhancement",
                "sort_order": 3,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "restoration",
                    "supported_formats": ["jpg", "jpeg", "png"],
                    "enhancement_type": "scratch_removal"
                }
            },
            {
                "id": "deblur-photo",
                "title": "Deblur Photo",
                "description": "Sharpen blurry images with AI",
                "icon": "🔍",
                "imagePath": "generated_menu_assets/icon_3.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "photo-enhancement",
                "sort_order": 4,
                "is_active": True,
                "is_premium": False,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "enhancement",
                    "supported_formats": ["jpg", "jpeg", "png", "webp"],
                    "enhancement_type": "deblurring"
                }
            },
            # Video Enhancement Items
            {
                "id": "enhance-video",
                "title": "Enhance Video",
                "description": "Improve video quality and resolution",
                "icon": "📹",
                "imagePath": "generated_menu_assets/icon_4.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "video-enhancement",
                "sort_order": 1,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "enhancement",
                    "supported_formats": ["mp4", "mov", "avi"],
                    "enhancement_type": "video_quality"
                }
            },
            {
                "id": "video-stabilization",
                "title": "Stabilize Video",
                "description": "Reduce camera shake and smooth motion",
                "icon": "🎯",
                "imagePath": "generated_menu_assets/icon_5.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "video-enhancement",
                "sort_order": 2,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "stabilization",
                    "supported_formats": ["mp4", "mov"],
                    "enhancement_type": "stabilization"
                }
            },
            # Creative Tools Items
            {
                "id": "ai-art-generator",
                "title": "AI Art Generator",
                "description": "Create stunning artwork from text prompts",
                "icon": "🎭",
                "imagePath": "generated_menu_assets/icon_6.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "creative-tools",
                "sort_order": 1,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "generation",
                    "supported_formats": ["jpg", "jpeg", "png"],
                    "generation_type": "art"
                }
            },
            {
                "id": "style-transfer",
                "title": "Style Transfer",
                "description": "Apply artistic styles to your photos",
                "icon": "🖼️",
                "imagePath": "generated_menu_assets/icon_7.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "creative-tools",
                "sort_order": 2,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "style_transfer",
                    "supported_formats": ["jpg", "jpeg", "png"],
                    "generation_type": "style_transfer"
                }
            },
            {
                "id": "background-remover",
                "title": "Background Remover",
                "description": "Remove or replace image backgrounds",
                "icon": "✂️",
                "imagePath": "generated_menu_assets/icon_8.png",
                "action_type": "screen",
                "action_value": "ModeSelection",
                "section_id": "creative-tools",
                "sort_order": 3,
                "is_active": True,
                "is_premium": True,
                "requires_auth": False,
                "metadata": {
                    "processing_type": "background_removal",
                    "supported_formats": ["jpg", "jpeg", "png"],
                    "enhancement_type": "background_removal"
                }
            },
            # Account & Settings Items
            {
                "id": "subscription",
                "title": "Subscription",
                "description": "Manage your premium subscription",
                "icon": "💳",
                "imagePath": "generated_menu_assets/icon_9.png",
                "action_type": "screen",
                "action_value": "Purchase",
                "section_id": "account-settings",
                "sort_order": 1,
                "is_active": True,
                "is_premium": False,
                "requires_auth": True,
                "metadata": {
                    "requires_auth": True,
                    "auth_level": "user"
                }
            },
            {
                "id": "settings",
                "title": "Settings",
                "description": "App preferences and configuration",
                "icon": "⚙️",
                "imagePath": "generated_menu_assets/icon_10.png",
                "action_type": "action",
                "action_value": "settings",
                "section_id": "account-settings",
                "sort_order": 2,
                "is_active": True,
                "is_premium": False,
                "requires_auth": False,
                "metadata": {
                    "action_type": "navigation",
                    "target": "settings"
                }
            },
            {
                "id": "profile",
                "title": "Profile",
                "description": "View and edit your profile",
                "icon": "👤",
                "imagePath": "generated_menu_assets/icon_11.png",
                "action_type": "screen",
                "action_value": "Profile",
                "section_id": "account-settings",
                "sort_order": 3,
                "is_active": True,
                "is_premium": False,
                "requires_auth": True,
                "metadata": {
                    "requires_auth": True,
                    "auth_level": "user"
                }
            },
            {
                "id": "help-support",
                "title": "Help & Support",
                "description": "Get help and contact support",
                "icon": "❓",
                "imagePath": "generated_menu_assets/icon_12.png",
                "action_type": "url",
                "action_value": "https://support.photorestore.com",
                "section_id": "account-settings",
                "sort_order": 4,
                "is_active": True,
                "is_premium": False,
                "requires_auth": False,
                "metadata": {
                    "external_link": True,
                    "link_type": "support"
                }
            },
            {
                "id": "about",
                "title": "About",
                "description": "Learn about PhotoRestore",
                "icon": "ℹ️",
                "imagePath": "generated_menu_assets/icon_13.png",
                "action_type": "action",
                "action_value": "about",
                "section_id": "account-settings",
                "sort_order": 5,
                "is_active": True,
                "is_premium": False,
                "requires_auth": False,
                "metadata": {
                    "action_type": "info",
                    "content_type": "about"
                }
            }
        ],
        "success": True
    }


if __name__ == "__main__":
    print("Menu Asset Generator for PhotoRestore App")
    print("=" * 50)
    print("This script will generate icons for all menu items using Gemini AI.")
    print("Make sure you have set your GEMINI_API_KEY environment variable.")
    print()

    generate()

    print("\n" + "=" * 50)
    print("Icon generation complete!")
    print("Check the 'generated_menu_assets' folder for the generated icons.")
    print("Check 'generated_menu_assets/HARDCODED_MENU_DATA.json' for the updated menu structure.")