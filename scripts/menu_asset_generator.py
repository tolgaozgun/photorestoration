#!/usr/bin/env python3
"""
Menu Asset Generator using Gemini 2.5 Flash

This script analyzes the HARDCODED_MENU_DATA structure and generates appropriate icons
for each menu item using Gemini's image generation capabilities.

Requirements:
- pip install google-genai
- Set GEMINI_API_KEY environment variable
"""

import base64
import mimetypes
import os
import json
import re
from typing import Dict, List, Any
from google import genai
from google.genai import types

def save_binary_file(file_name: str, data: bytes):
    """Save binary data to a file."""
    f = open(file_name, "wb")
    f.write(data)
    f.close()
    print(f"File saved to: {file_name}")

def clean_text(text: str) -> str:
    """Clean text for use in filenames."""
    # Remove special characters and replace with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.lower().strip('-')

def generate_menu_data() -> Dict[str, Any]:
    """Generate the menu data structure with image paths."""
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
                "imagePath": "assets/icons/enhance-photo.png",
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
                "imagePath": "assets/icons/colorize-photo.png",
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
                "imagePath": "assets/icons/remove-scratches.png",
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
                "imagePath": "assets/icons/deblur-photo.png",
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
                "imagePath": "assets/icons/enhance-video.png",
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
                "imagePath": "assets/icons/video-stabilization.png",
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
                "imagePath": "assets/icons/ai-art-generator.png",
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
                "imagePath": "assets/icons/style-transfer.png",
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
                "imagePath": "assets/icons/background-remover.png",
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
                "imagePath": "assets/icons/subscription.png",
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
                "imagePath": "assets/icons/settings.png",
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
                "imagePath": "assets/icons/profile.png",
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
                "imagePath": "assets/icons/help-support.png",
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
                "imagePath": "assets/icons/about.png",
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

def create_menu_visualization_prompt(menu_data: Dict[str, Any]) -> str:
    """Create a prompt for visualizing the menu structure."""

    prompt = """I need you to create modern, clean icons for a photo restoration mobile app menu.

Here's the menu structure with sections and items:

SECTIONS:
"""

    for section in menu_data["sections"]:
        prompt += f"""
• {section['title']} ({section['icon']})
  Description: {section['description']}
  Layout: {section['layout']}
"""

    prompt += "\nMENU ITEMS:\n"

    for item in menu_data["items"]:
        prompt += f"""
• {item['title']} ({item['icon']})
  Description: {item['description']}
  Category: {next(s['title'] for s in menu_data['sections'] if s['id'] == item['section_id'])}
  Premium: {'Yes' if item['is_premium'] else 'No'}
"""

    prompt += """

Please generate a modern, clean icon for each menu item. The icons should:
- Be simple and recognizable at small sizes
- Use a consistent design style
- Work well on both light and dark backgrounds
- Be 64x64 pixels
- Use a modern, minimalist approach with subtle colors
- Include a visual metaphor that represents the function

Generate each icon as a separate image. For each icon, also provide a brief description of the design concept.

Please return the icons in this format:
1. Icon Name: [name]
   Description: [brief description]
   [Image]

2. Icon Name: [name]
   Description: [brief description]
   [Image]

And so on for all menu items.
"""

    return prompt

def generate_icons():
    """Generate icons for all menu items using Gemini."""

    # Check if API key is set
    if not os.environ.get("GEMINI_API_KEY"):
        print("Error: Please set GEMINI_API_KEY environment variable")
        return

    # Create output directory
    os.makedirs("generated_icons", exist_ok=True)

    # Get menu data
    menu_data = generate_menu_data()

    # Create client
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    # Create prompt
    prompt = create_menu_visualization_prompt(menu_data)

    # Setup generation config
    generate_content_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
    )

    print("Generating menu icons...")
    print("This may take a few minutes...\n")

    file_index = 0
    icon_descriptions = []

    try:
        # Generate content
        for chunk in client.models.generate_content_stream(
            model="gemini-2.5-flash-image-preview",
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            config=generate_content_config,
        ):
            if (chunk.candidates is None or
                chunk.candidates[0].content is None or
                chunk.candidates[0].content.parts is None):
                continue

            for part in chunk.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    # Save image
                    inline_data = part.inline_data
                    data_buffer = inline_data.data
                    file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
                    file_name = f"generated_icons/icon_{file_index}{file_extension}"
                    save_binary_file(file_name, data_buffer)
                    file_index += 1
                elif part.text:
                    # Process text for icon descriptions
                    print(part.text)
                    icon_descriptions.append(part.text)

        # Save the updated menu data with image paths
        menu_data_file = "generated_menu_data.json"
        with open(menu_data_file, "w") as f:
            json.dump(menu_data, f, indent=2)
        print(f"\nMenu data saved to: {menu_data_file}")

        # Save icon descriptions
        if icon_descriptions:
            descriptions_file = "generated_icons/icon_descriptions.txt"
            with open(descriptions_file, "w") as f:
                f.write("\n".join(icon_descriptions))
            print(f"Icon descriptions saved to: {descriptions_file}")

        print(f"\nGenerated {file_index} icons successfully!")

    except Exception as e:
        print(f"Error generating icons: {e}")
        print("Make sure you have the correct API key and internet connection.")

def main():
    """Main function."""
    print("Menu Asset Generator for PhotoRestore App")
    print("=" * 50)
    print("This script will generate icons for all menu items using Gemini AI.")
    print("Make sure you have set your GEMINI_API_KEY environment variable.")
    print()

    # Create output directory
    os.makedirs("generated_icons", exist_ok=True)

    # Generate icons
    generate_icons()

    print("\n" + "=" * 50)
    print("Icon generation complete!")
    print("Check the 'generated_icons' folder for the generated icons.")
    print("Check 'generated_menu_data.json' for the updated menu structure.")

if __name__ == "__main__":
    main()