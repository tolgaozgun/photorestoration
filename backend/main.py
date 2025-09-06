#!/usr/bin/env python3
"""
Photo Restoration Backend Application
Main entry point for the restructured application
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)