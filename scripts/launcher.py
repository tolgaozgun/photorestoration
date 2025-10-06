#!/usr/bin/env python3
"""
Category Asset Generator Launcher

This script launches the GUI version of the category asset generator.
"""

import sys
import os
import subprocess

def check_dependencies():
    """Check if required dependencies are installed."""
    required_packages = ['google', 'PIL']
    missing_packages = []

    for package in required_packages:
        try:
            if package == 'google':
                import google.genai
            elif package == 'PIL':
                from PIL import Image
        except ImportError:
            missing_packages.append(package)

    # Check tkinter separately (usually comes with Python)
    try:
        import tkinter
    except ImportError:
        print("Warning: tkinter not found. This usually comes with Python.")
        print("On Ubuntu/Debian, you can install it with: sudo apt-get install python3-tk")
        print("On macOS, it should come pre-installed with Python.")
        print("On Windows, it should come pre-installed with Python.")
        return False

    if missing_packages:
        print(f"Missing required packages: {', '.join(missing_packages)}")
        print("Please install them using: pip install -r requirements.txt")
        return False

    return True

def check_api_key():
    """Check if Gemini API key is set."""
    if not os.environ.get("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY environment variable not set")
        print("Please set it using: export GEMINI_API_KEY='your-api-key'")
        print("Or set it in your system environment variables")
        return False
    return True

def main():
    """Main launcher function."""
    print("Category Asset Generator Launcher")
    print("=" * 40)

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Check API key
    check_api_key()

    # Launch GUI
    try:
        from menu_asset_generator_gui import CategoryAssetGeneratorGUI
        import tkinter as tk

        print("Launching GUI...")
        root = tk.Tk()
        app = CategoryAssetGeneratorGUI(root)
        root.mainloop()

    except KeyboardInterrupt:
        print("\nApplication terminated by user")
    except Exception as e:
        print(f"Error launching GUI: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()