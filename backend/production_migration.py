#!/usr/bin/env python3
"""
Production migration script to add new columns for multi-size images and blurhash
Run this in the production backend container:
python production_migration.py
"""

import sys
import os
sys.path.append('/app')

from app.models.database import engine
from sqlalchemy import inspect, text

def run_migration():
    """Add missing columns to enhancements table"""
    print("Starting production database migration...")

    # Check current columns
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('enhancements')]
    print(f"Current columns: {columns}")

    # Add missing columns if they don't exist
    conn = engine.connect()
    changes_made = []

    try:
        if 'thumbnail_url' not in columns:
            print("Adding thumbnail_url column...")
            conn.execute(text('ALTER TABLE enhancements ADD COLUMN thumbnail_url VARCHAR'))
            changes_made.append("thumbnail_url")

        if 'preview_url' not in columns:
            print("Adding preview_url column...")
            conn.execute(text('ALTER TABLE enhancements ADD COLUMN preview_url VARCHAR'))
            changes_made.append("preview_url")

        if 'blurhash' not in columns:
            print("Adding blurhash column...")
            conn.execute(text('ALTER TABLE enhancements ADD COLUMN blurhash VARCHAR'))
            changes_made.append("blurhash")

        conn.commit()

        if changes_made:
            print(f"✅ Migration completed successfully! Added columns: {', '.join(changes_made)}")
        else:
            print("✅ All columns already exist. No migration needed.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()