"""
Menu Data Seeder

This script creates sample menu sections and items for the PhotoRestore app.
Run this script to populate the database with initial menu data.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models import MenuItem, MenuSection, Base
from app.config import settings

def seed_menu_data():
    """Seed the database with sample menu data"""
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing menu data
        db.query(MenuItem).delete()
        db.query(MenuSection).delete()
        
        # Create menu sections
        sections = [
            {
                "name": "photo_enhancement",
                "title": "Photo Enhancement",
                "description": "Enhance and restore your photos with AI",
                "icon": "✨",
                "layout": "grid",
                "sort_order": 1,
                "meta_data": {"category": "primary"}
            },
            {
                "name": "creative_tools",
                "title": "Creative Tools",
                "description": "Transform your photos with creative effects",
                "icon": "🎨",
                "layout": "horizontal",
                "sort_order": 2,
                "meta_data": {"category": "secondary"}
            },
            {
                "name": "ai_features",
                "title": "AI Features",
                "description": "Advanced AI-powered features",
                "icon": "🤖",
                "layout": "grid",
                "sort_order": 3,
                "meta_data": {"category": "premium"}
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
            # Photo Enhancement Section
            {
                "title": "Enhance Photo",
                "description": "Improve photo quality and resolution",
                "icon": "✨",
                "action_type": "screen",
                "action_value": "PhotoEnhancement",
                "section_id": created_sections[0].id,
                "sort_order": 1,
                "is_premium": False,
                "requires_auth": False
            },
            {
                "title": "Colorize B&W",
                "description": "Add color to black and white photos",
                "icon": "🎨",
                "action_type": "screen",
                "action_value": "ColorizePhoto",
                "section_id": created_sections[0].id,
                "sort_order": 2,
                "is_premium": False,
                "requires_auth": False
            },
            {
                "title": "Remove Scratches",
                "description": "Fix damaged and scratched photos",
                "icon": "🔧",
                "action_type": "screen",
                "action_value": "RemoveScratches",
                "section_id": created_sections[0].id,
                "sort_order": 3,
                "is_premium": True,
                "requires_auth": False
            },
            {
                "title": "Face Enhancement",
                "description": "Enhance faces and portraits",
                "icon": "👤",
                "action_type": "screen",
                "action_value": "FaceEnhancement",
                "section_id": created_sections[0].id,
                "sort_order": 4,
                "is_premium": True,
                "requires_auth": False
            },
            
            # Creative Tools Section
            {
                "title": "Artistic Filters",
                "description": "Apply artistic filters and effects",
                "icon": "🖼️",
                "action_type": "screen",
                "action_value": "ArtisticFilters",
                "section_id": created_sections[1].id,
                "sort_order": 1,
                "is_premium": False,
                "requires_auth": False
            },
            {
                "title": "Background Change",
                "description": "Change or remove backgrounds",
                "icon": "🌅",
                "action_type": "screen",
                "action_value": "BackgroundChange",
                "section_id": created_sections[1].id,
                "sort_order": 2,
                "is_premium": True,
                "requires_auth": False
            },
            {
                "title": "Style Transfer",
                "description": "Transfer artistic styles to photos",
                "icon": "🎭",
                "action_type": "screen",
                "action_value": "StyleTransfer",
                "section_id": created_sections[1].id,
                "sort_order": 3,
                "is_premium": True,
                "requires_auth": False
            },
            
            # AI Features Section
            {
                "title": "Future Baby",
                "description": "See what your future baby might look like",
                "icon": "🍼",
                "action_type": "screen",
                "action_value": "FutureBaby",
                "section_id": created_sections[2].id,
                "sort_order": 1,
                "is_premium": True,
                "requires_auth": True
            },
            {
                "title": "Age Progression",
                "description": "See how someone might look in the future",
                "icon": "👴",
                "action_type": "screen",
                "action_value": "AgeProgression",
                "section_id": created_sections[2].id,
                "sort_order": 2,
                "is_premium": True,
                "requires_auth": True
            },
            {
                "title": "Digital Twin",
                "description": "Create your digital avatar",
                "icon": "🎭",
                "action_type": "screen",
                "action_value": "DigitalTwin",
                "section_id": created_sections[2].id,
                "sort_order": 3,
                "is_premium": True,
                "requires_auth": True
            },
            {
                "title": "Outfit Try-On",
                "description": "Try different outfits on your photos",
                "icon": "👕",
                "action_type": "screen",
                "action_value": "OutfitTryOn",
                "section_id": created_sections[2].id,
                "sort_order": 4,
                "is_premium": True,
                "requires_auth": True
            }
        ]
        
        # Create items
        for item_data in items:
            item = MenuItem(**item_data)
            db.add(item)
        
        db.commit()
        
        print("✅ Menu data seeded successfully!")
        print(f"Created {len(created_sections)} sections and {len(items)} items")
        
    except Exception as e:
        print(f"❌ Error seeding menu data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_menu_data()