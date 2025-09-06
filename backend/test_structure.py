#!/usr/bin/env python3
"""
Simple test script to verify the restructured application imports correctly
"""

import sys
import os
sys.path.insert(0, '/Users/tolgaozgun/Projects/photorestoration/backend')

try:
    # Test basic imports
    print("Testing imports...")
    
    # Test config
    from app.config import settings
    print("✅ Config import successful")
    
    # Test models
    from app.models import User, Enhancement, get_db
    print("✅ Models import successful")
    
    # Test schemas
    from app.schemas import EnhanceRequest, EnhancementResponse
    print("✅ Schemas import successful")
    
    # Test services
    from app.services import UserService, EnhancementService
    print("✅ Services import successful")
    
    # Test routes
    from app.routes import enhancement_router, purchase_router
    print("✅ Routes import successful")
    
    # Test main app
    from app.main import app
    print("✅ Main app import successful")
    
    print("\n🎉 All imports successful! The restructured application is working correctly.")
    
    # Print app info
    print(f"\nApp Title: {app.title}")
    print(f"App Version: {app.version}")
    print(f"Number of routes: {len(app.routes)}")
    
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)