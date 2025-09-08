"""
Automatic menu data seeder

This module automatically seeds menu data when the application starts
if the menu tables are empty.
"""

import logging
from ..models import MenuItem, MenuSection, Base, SessionLocal, engine

logger = logging.getLogger(__name__)

def seed_menu_data_if_needed():
    """Seed menu data if tables are empty"""
    try:
        # Use existing database connection
        db = SessionLocal()
        
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        try:
            # Check if menu sections exist
            sections_count = db.query(MenuSection).count()
            items_count = db.query(MenuItem).count()
            
            if sections_count == 0 and items_count == 0:
                logger.info("No menu data found, seeding initial menu data...")
                
                # Create menu sections
                sections = [
                    {
                        "name": "home_screen",
                        "title": "Home",
                        "description": "Main dashboard with recent activity and quick actions",
                        "icon": "🏠",
                        "layout": "grid",
                        "sort_order": 1,
                        "meta_data": {"screen": "home", "supports_all_formats": true}
                    },
                    {
                        "name": "create_screen",
                        "title": "Create",
                        "description": "Create new content with AI-powered tools",
                        "icon": "➕",
                        "layout": "grid",
                        "sort_order": 2,
                        "meta_data": {"screen": "create", "supports_all_formats": true}
                    },
                    {
                        "name": "enhance_screen",
                        "title": "Enhance",
                        "description": "Enhance and restore your photos with AI",
                        "icon": "✨",
                        "layout": "grid",
                        "sort_order": 3,
                        "meta_data": {"screen": "enhance", "supports_all_formats": true}
                    },
                    {
                        "name": "video_screen",
                        "title": "Video",
                        "description": "Video enhancement and creation tools",
                        "icon": "🎥",
                        "layout": "grid",
                        "sort_order": 4,
                        "meta_data": {"screen": "video", "supports_all_formats": true}
                    }
                ]
                
                # Create sections
                created_sections = []
                for section_data in sections:
                    section = MenuSection(**section_data)
                    db.add(section)
                    created_sections.append(section)
                
                db.commit()
                
                # Create menu items - moved from hardcoded mobile app data
                items = [
                    # Home Screen Items (from App.tsx tab navigation and HomeScreen.tsx content)
                    {
                        "title": "Recent Projects",
                        "description": "View and continue your recent work",
                        "icon": "📁",
                        "action_type": "screen",
                        "action_value": "RecentProjects",
                        "section_id": created_sections[0].id,
                        "sort_order": 1,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
                            "content_type": "recent",
                            "navigation_type": "stack"
                        }
                    },
                    {
                        "title": "Future Baby",
                        "description": "See what your future baby might look like",
                        "icon": "🍼",
                        "action_type": "screen",
                        "action_value": "FutureBaby",
                        "section_id": created_sections[0].id,
                        "sort_order": 2,
                        "is_premium": True,
                        "requires_auth": True,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "ai_feature",
                            "original_id": "future-baby",
                            "credits": 3
                        }
                    },
                    {
                        "title": "Remove Elements",
                        "description": "Remove unwanted elements from photos",
                        "icon": "🎭",
                        "action_type": "screen",
                        "action_value": "RemoveElements",
                        "section_id": created_sections[0].id,
                        "sort_order": 3,
                        "is_premium": True,
                        "requires_auth": True,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "ai_feature",
                            "original_id": "remove-elements",
                            "credits": 2
                        }
                    },
                    {
                        "title": "Outfit Try-On",
                        "description": "Try different outfits on your photos",
                        "icon": "👕",
                        "action_type": "screen",
                        "action_value": "OutfitTryOn",
                        "section_id": created_sections[0].id,
                        "sort_order": 4,
                        "is_premium": True,
                        "requires_auth": True,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "ai_feature",
                            "original_id": "outfit-tryon",
                            "credits": 3
                        }
                    },
                    {
                        "title": "Digital Twin",
                        "description": "Create your digital avatar",
                        "icon": "🎭",
                        "action_type": "screen",
                        "action_value": "DigitalTwin",
                        "section_id": created_sections[0].id,
                        "sort_order": 5,
                        "is_premium": True,
                        "requires_auth": True,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "ai_feature",
                            "original_id": "digital-twin",
                            "credits": 4
                        }
                    },
                    {
                        "title": "Pixel Trend",
                        "description": "Transform photos with pixel art effects",
                        "icon": "🎮",
                        "action_type": "screen",
                        "action_value": "PixelTrend",
                        "section_id": created_sections[0].id,
                        "sort_order": 6,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "creative",
                            "original_id": "pixel-trend",
                            "credits": 1
                        }
                    },
                    {
                        "title": "Chibi Stickers",
                        "description": "Create chibi-style stickers from photos",
                        "icon": "🎨",
                        "action_type": "screen",
                        "action_value": "ChibiStickers",
                        "section_id": created_sections[0].id,
                        "sort_order": 7,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "creative",
                            "original_id": "chibi-stickers",
                            "credits": 1
                        }
                    },
                    {
                        "title": "Animate Old Photos",
                        "description": "Bring old photos to life with animation",
                        "icon": "📹",
                        "action_type": "screen",
                        "action_value": "AnimateOldPhotos",
                        "section_id": created_sections[0].id,
                        "sort_order": 8,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
                            "content_type": "video_feature",
                            "original_id": "animate-old-photos",
                            "credits": 3
                        }
                    },
                    {
                        "title": "Face Animation",
                        "description": "Animate faces in photos with AI",
                        "icon": "😊",
                        "action_type": "screen",
                        "action_value": "FaceAnimation",
                        "section_id": created_sections[0].id,
                        "sort_order": 9,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
                            "content_type": "video_feature",
                            "original_id": "face-animation",
                            "credits": 2
                        }
                    },
                    {
                        "title": "Photo to Video",
                        "description": "Convert photos to animated videos",
                        "icon": "🎬",
                        "action_type": "screen",
                        "action_value": "PhotoToVideo",
                        "section_id": created_sections[0].id,
                        "sort_order": 10,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
                            "content_type": "video_feature",
                            "original_id": "photo-to-video",
                            "credits": 2
                        }
                    },
                    
                    # Create Screen Items (from AIGenerationScreen and creative features)
                    {
                        "title": "AI Generation",
                        "description": "Generate images from text prompts",
                        "icon": "🎨",
                        "action_type": "screen",
                        "action_value": "AIGeneration",
                        "section_id": created_sections[1].id,
                        "sort_order": 1,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "generation_type": "text_to_image",
                            "navigation_type": "stack",
                            "credits": 1
                        }
                    },
                    {
                        "title": "Image to Image",
                        "description": "Transform images with AI",
                        "icon": "🖼️",
                        "action_type": "screen",
                        "action_value": "ImageToImage",
                        "section_id": created_sections[1].id,
                        "sort_order": 2,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "generation_type": "image_to_image",
                            "credits": 2
                        }
                    },
                    {
                        "title": "Background Generator",
                        "description": "Generate custom backgrounds",
                        "icon": "🌅",
                        "action_type": "screen",
                        "action_value": "BackgroundGenerator",
                        "section_id": created_sections[1].id,
                        "sort_order": 3,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "generation_type": "background",
                            "credits": 2
                        }
                    },
                    {
                        "title": "Logo Generator",
                        "description": "Create logos with AI",
                        "icon": "🎯",
                        "action_type": "screen",
                        "action_value": "LogoGenerator",
                        "section_id": created_sections[1].id,
                        "sort_order": 4,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "generation_type": "logo",
                            "credits": 3
                        }
                    },
                    {
                        "title": "Video Generation",
                        "description": "Generate videos from text prompts",
                        "icon": "🎥",
                        "action_type": "screen",
                        "action_value": "VideoGeneration",
                        "section_id": created_sections[1].id,
                        "sort_order": 5,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["mp4", "mov", "avi", "mkv", "webm"],
                            "generation_type": "text_to_video",
                            "credits": 4
                        }
                    },
                    
                    # Enhance Screen Items (from ModeSelectionScreen enhancement modes)
                    {
                        "title": "Enhance Photo",
                        "description": "Improve photo quality and resolution",
                        "icon": "✨",
                        "action_type": "screen",
                        "action_value": "PhotoEnhancement",
                        "section_id": created_sections[2].id,
                        "sort_order": 1,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "quality",
                            "original_id": "enhance",
                            "credits": 1,
                            "processing_time": "2-3s"
                        }
                    },
                    {
                        "title": "Colorize B&W",
                        "description": "Add color to black and white photos",
                        "icon": "🎨",
                        "action_type": "screen",
                        "action_value": "ColorizePhoto",
                        "section_id": created_sections[2].id,
                        "sort_order": 2,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "colorize",
                            "original_id": "colorize",
                            "credits": 2,
                            "processing_time": "3-4s"
                        }
                    },
                    {
                        "title": "Remove Scratches",
                        "description": "Fix damaged and scratched photos",
                        "icon": "🔧",
                        "action_type": "screen",
                        "action_value": "RemoveScratches",
                        "section_id": created_sections[2].id,
                        "sort_order": 3,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "restoration",
                            "original_id": "de-scratch",
                            "credits": 2,
                            "processing_time": "4-5s"
                        }
                    },
                    {
                        "title": "Enlighten",
                        "description": "Brighten and enhance dark photos",
                        "icon": "☀️",
                        "action_type": "screen",
                        "action_value": "Enlighten",
                        "section_id": created_sections[2].id,
                        "sort_order": 4,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "lighting",
                            "original_id": "enlighten",
                            "credits": 1,
                            "processing_time": "2-3s"
                        }
                    },
                    {
                        "title": "Recreate",
                        "description": "Recreate photos with artistic styles",
                        "icon": "🎭",
                        "action_type": "screen",
                        "action_value": "Recreate",
                        "section_id": created_sections[2].id,
                        "sort_order": 5,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "artistic",
                            "original_id": "recreate",
                            "credits": 3,
                            "processing_time": "5-6s"
                        }
                    },
                    {
                        "title": "Combine",
                        "description": "Combine multiple photos creatively",
                        "icon": "🔄",
                        "action_type": "screen",
                        "action_value": "Combine",
                        "section_id": created_sections[2].id,
                        "sort_order": 6,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "composite",
                            "original_id": "combine",
                            "credits": 4,
                            "processing_time": "6-8s"
                        }
                    },
                    {
                        "title": "Face Enhancement",
                        "description": "Enhance faces and portraits",
                        "icon": "👤",
                        "action_type": "screen",
                        "action_value": "FaceEnhancement",
                        "section_id": created_sections[2].id,
                        "sort_order": 7,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "face",
                            "credits": 2
                        }
                    },
                    {
                        "title": "AI Upscale",
                        "description": "Increase image resolution with AI",
                        "icon": "📈",
                        "action_type": "screen",
                        "action_value": "AIUpscale",
                        "section_id": created_sections[2].id,
                        "sort_order": 8,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "upscale",
                            "credits": 3
                        }
                    },
                    
                    # Video Screen Items (from video features and processing)
                    {
                        "title": "Video Enhancement",
                        "description": "Enhance video quality and resolution",
                        "icon": "🎥",
                        "action_type": "screen",
                        "action_value": "VideoEnhancement",
                        "section_id": created_sections[3].id,
                        "sort_order": 1,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["mp4", "mov", "avi", "mkv", "webm", "gif"],
                            "processing_type": "video_enhance",
                            "credits": 2
                        }
                    },
                    {
                        "title": "Video Colorize",
                        "description": "Add color to black and white videos",
                        "icon": "🎨",
                        "action_type": "screen",
                        "action_value": "VideoColorize",
                        "section_id": created_sections[3].id,
                        "sort_order": 2,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["mp4", "mov", "avi", "mkv", "webm"],
                            "processing_type": "video_colorize",
                            "credits": 3
                        }
                    },
                    {
                        "title": "Video Upscale",
                        "description": "Increase video resolution with AI",
                        "icon": "📈",
                        "action_type": "screen",
                        "action_value": "VideoUpscale",
                        "section_id": created_sections[3].id,
                        "sort_order": 3,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["mp4", "mov", "avi", "mkv", "webm"],
                            "processing_type": "video_upscale",
                            "credits": 4
                        }
                    },
                    {
                        "title": "GIF Creator",
                        "description": "Create GIFs from images or videos",
                        "icon": "🎞️",
                        "action_type": "screen",
                        "action_value": "GIFCreator",
                        "section_id": created_sections[3].id,
                        "sort_order": 4,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
                            "processing_type": "gif_creation",
                            "credits": 1
                        }
                    },
                    {
                        "title": "Video Stabilization",
                        "description": "Stabilize shaky videos",
                        "icon": "🎯",
                        "action_type": "screen",
                        "action_value": "VideoStabilization",
                        "section_id": created_sections[3].id,
                        "sort_order": 5,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["mp4", "mov", "avi", "mkv", "webm"],
                            "processing_type": "video_stabilize",
                            "credits": 2
                        }
                    }
                ]
                
                # Create items
                for item_data in items:
                    item = MenuItem(**item_data)
                    db.add(item)
                
                db.commit()
                
                logger.info(f"✅ Menu data seeded successfully! Created {len(created_sections)} sections and {len(items)} items")
                
            else:
                logger.info(f"Menu data already exists ({sections_count} sections, {items_count} items)")
                
        except Exception as e:
            logger.error(f"❌ Error seeding menu data: {e}")
            db.rollback()
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Error connecting to database for menu seeding: {e}")
        # Don't raise here - we don't want to prevent app startup if seeding fails