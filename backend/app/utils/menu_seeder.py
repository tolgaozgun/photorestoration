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
                
                # Create menu items
                items = [
                    # Home Screen Items
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
                            "content_type": "recent"
                        }
                    },
                    {
                        "title": "Quick Enhance",
                        "description": "Fast photo enhancement with AI",
                        "icon": "⚡",
                        "action_type": "screen",
                        "action_value": "QuickEnhance",
                        "section_id": created_sections[0].id,
                        "sort_order": 2,
                        "is_premium": False,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "processing_type": "enhance"
                        }
                    },
                    {
                        "title": "Templates",
                        "description": "Use pre-made templates and styles",
                        "icon": "📋",
                        "action_type": "screen",
                        "action_value": "Templates",
                        "section_id": created_sections[0].id,
                        "sort_order": 3,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "content_type": "templates"
                        }
                    },
                    
                    # Create Screen Items
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
                            "generation_type": "text_to_image"
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
                            "generation_type": "image_to_image"
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
                            "generation_type": "background"
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
                            "generation_type": "logo"
                        }
                    },
                    
                    # Enhance Screen Items
                    {
                        "title": "Photo Enhancement",
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
                            "enhancement_type": "quality"
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
                            "enhancement_type": "colorize"
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
                            "enhancement_type": "restoration"
                        }
                    },
                    {
                        "title": "Face Enhancement",
                        "description": "Enhance faces and portraits",
                        "icon": "👤",
                        "action_type": "screen",
                        "action_value": "FaceEnhancement",
                        "section_id": created_sections[2].id,
                        "sort_order": 4,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "face"
                        }
                    },
                    {
                        "title": "AI Upscale",
                        "description": "Increase image resolution with AI",
                        "icon": "📈",
                        "action_type": "screen",
                        "action_value": "AIUpscale",
                        "section_id": created_sections[2].id,
                        "sort_order": 5,
                        "is_premium": True,
                        "requires_auth": False,
                        "meta_data": {
                            "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
                            "enhancement_type": "upscale"
                        }
                    },
                    
                    # Video Screen Items
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
                            "processing_type": "video_enhance"
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
                            "processing_type": "video_colorize"
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
                            "processing_type": "video_upscale"
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
                            "processing_type": "gif_creation"
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
                            "processing_type": "video_stabilize"
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