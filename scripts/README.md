# Menu Asset Generator GUI

A powerful GUI application that simulates your mobile app's menu system and allows you to generate and regenerate custom icons using Gemini AI.

## Features

### 🎨 Interactive Menu Preview
- **Visual Menu Simulation**: See your menu exactly as it would appear in the mobile app
- **Section Navigation**: Navigate through different menu sections (Photo Enhancement, Video Enhancement, Creative Tools, Account & Settings)
- **Grid Layout**: Realistic grid-based menu item display
- **Hover Effects**: Interactive hover states for better user experience

### 🔧 Icon Generation & Management
- **Batch Generation**: Generate all icons at once with a single click
- **Selective Regeneration**: Click on specific menu items to regenerate only their icons
- **Real-time Preview**: See generated icons immediately in the menu preview
- **Fallback Support**: Graceful fallback to emoji icons when images aren't available

### 🎯 Advanced Controls
- **Selection Queue**: Build a queue of items to regenerate
- **Progress Tracking**: Visual progress bar for generation operations
- **Status Logging**: Detailed status messages with timestamps
- **Error Handling**: Comprehensive error reporting and recovery

### 💾 Export & Save Options
- **Menu Data Export**: Save complete HARDCODED_MENU_DATA with image paths
- **Icon Export**: Export all generated icons to a directory
- **JSON Format**: Standard JSON format for easy integration

## Installation

### Prerequisites
- Python 3.8 or higher
- tkinter (usually comes pre-installed with Python)

### 1. Install Python Dependencies
```bash
pip install -r scripts/requirements.txt
```

### 2. Install tkinter (if not already installed)
**On Ubuntu/Debian:**
```bash
sudo apt-get install python3-tk
```

**On macOS and Windows:**
tkinter usually comes pre-installed with Python. If you're using a Python version that doesn't include it, you may need to reinstall Python or install it separately.

### 3. Set Gemini API Key
```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 4. Run the Application
```bash
# Using the launcher (recommended)
python scripts/launcher.py

# Or directly
python scripts/menu_asset_generator_gui.py
```

## Usage Guide

### 1. Initial Setup
- Launch the application using the launcher
- Verify that your Gemini API key is properly set
- The GUI will initialize with the current menu structure

### 2. Exploring the Menu
- Use the section dropdown to navigate between menu sections
- Use the arrow buttons (◀ ▶) to cycle through sections
- Click on menu items to select them for regeneration

### 3. Generating Icons
- **Generate All Icons**: Click "Generate All Icons" to create icons for every menu item
- **Generate Selected**: Click on menu items to add them to the selection list, then click "Generate Selected"
- **Progress Monitoring**: Watch the progress bar and status messages for updates

### 4. Managing Icons
- **Clear All**: Remove all generated icons and start fresh
- **Export Icons**: Save all generated icons to a directory
- **Save Menu Data**: Export the complete menu structure with image paths

### 5. Working with Generated Assets
- Generated icons are automatically displayed in the menu preview
- Icons are stored as 64x64 PNG files with transparent backgrounds
- Each icon is optimized for mobile display and consistent styling

## Menu Structure

The application includes four main sections:

### Photo Enhancement
- Enhance Photo ✨
- Colorize Photo 🎨
- Remove Scratches 🔧
- Deblur Photo 🔍

### Video Enhancement
- Enhance Video 📹
- Stabilize Video 🎯

### Creative Tools
- AI Art Generator 🎭
- Style Transfer 🖼️
- Background Remover ✂️

### Account & Settings
- Subscription 💳
- Settings ⚙️
- Profile 👤
- Help & Support ❓
- About ℹ️

## Technical Features

### Gemini AI Integration
- Uses Gemini 2.5 Flash for high-quality icon generation
- Custom prompts for each menu item based on its functionality
- Consistent design language across all generated icons
- 64x64 pixel resolution with transparent backgrounds

### GUI Architecture
- Built with tkinter for cross-platform compatibility
- Threading for non-blocking icon generation
- Real-time UI updates during generation
- Responsive layout that adapts to window size

### Error Handling
- Graceful fallback to emoji icons
- Comprehensive error logging
- API connection validation
- File system error handling

## File Structure

```
scripts/
├── menu_asset_generator_gui.py  # Main GUI application
├── launcher.py                  # Application launcher
├── requirements.txt            # Python dependencies
├── README.md                   # This file
└── generated_menu_assets/      # Output directory (created automatically)
    ├── icon_enhance-photo.png
    ├── icon_colorize-photo.png
    └── ... (other generated icons)
```

## Troubleshooting

### Common Issues

**API Key Not Set**
```
Error: GEMINI_API_KEY environment variable not set
```
Solution: Set your Gemini API key in the environment variables

**Missing Dependencies**
```
ImportError: No module named 'google.genai'
```
Solution: Install dependencies using `pip install -r requirements.txt`

**Generation Fails**
```
Error generating icons: API quota exceeded
```
Solution: Check your Gemini API quota and try again later

### Tips for Best Results

1. **Good Internet Connection**: Ensure stable internet for API calls
2. **API Quota**: Monitor your Gemini API usage
3. **Consistent Styling**: The AI maintains consistency across generated icons
4. **File Management**: Regularly export and backup your generated icons
5. **Iterative Process**: Regenerate individual icons until satisfied with results

## Advanced Usage

### Custom Menu Items
You can modify the `generate_sample_menu_data()` method to include your own menu items.

### Styling Customization
Update the color scheme in the `__init__` method to match your app's branding.

### Batch Processing
Use the selection queue to regenerate multiple icons in sequence while maintaining progress tracking.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the status messages in the GUI
3. Verify your API key and internet connection
4. Ensure all dependencies are properly installed

---

Happy icon generating! 🎨✨