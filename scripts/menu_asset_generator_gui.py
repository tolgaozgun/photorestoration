#!/usr/bin/env python3
"""
Menu Asset Generator with GUI

This script creates a GUI that simulates the mobile app menu system and allows
users to preview menu items and regenerate specific icons using Gemini AI.

Requirements:
- pip install google-genai pillow
- Set GEMINI_API_KEY environment variable
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
import json
import os
import threading
import mimetypes
import datetime
from typing import Dict, List, Any, Optional
from google import genai
from google.genai import types
from PIL import Image, ImageTk, ImageDraw
import io


class CategoryAssetGeneratorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Category Asset Generator - PhotoRestore App")
        self.root.geometry("1400x900")

        # Initialize variables
        self.client = None
        self.category_data = self.generate_category_data()
        self.video_data = self.generate_video_data()
        self.current_data_type = 'categories'  # 'categories' or 'videos'
        self.current_category_index = 0
        self.current_item_index = 0
        self.generated_icons = {}
        self.regeneration_queue = []
        self.is_generating = False
        self.preview_window = None

        # Colors (matching mobile app theme)
        self.colors = {
            'primary': '#007AFF',
            'secondary': '#8E8E93',
            'background': '#000000',
            'surface': '#1C1C1E',
            'accent': '#FF6B6B',
            'success': '#34C759',
            'warning': '#FF9500'
        }

        # Setup GUI
        self.setup_gui()
        self.setup_gemini_client()

    def setup_gui(self):
        """Setup the main GUI layout."""

        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Title
        title_label = ttk.Label(main_frame, text="Category Asset Generator",
                              font=('Arial', 20, 'bold'))
        title_label.pack(pady=(0, 10))

        # Create main sections
        self.create_data_type_selector(main_frame)
        self.create_category_preview(main_frame)
        self.create_control_panel(main_frame)
        self.create_status_panel(main_frame)

        # Load existing icons if available
        self.load_existing_icons()

    def create_data_type_selector(self, parent):
        """Create the data type selector (categories vs videos)."""

        selector_frame = ttk.LabelFrame(parent, text="Data Type", padding=10)
        selector_frame.pack(fill=tk.X, pady=(0, 10))

        # Radio buttons for data type selection
        self.data_type_var = tk.StringVar(value='categories')
        ttk.Radiobutton(selector_frame, text="Category Detail Screen",
                       variable=self.data_type_var, value='categories',
                       command=self.on_data_type_changed).pack(side=tk.LEFT, padx=(0, 20))
        ttk.Radiobutton(selector_frame, text="AI Videos Screen",
                       variable=self.data_type_var, value='videos',
                       command=self.on_data_type_changed).pack(side=tk.LEFT, padx=(0, 20))

        # Data info
        self.data_info_label = ttk.Label(selector_frame, text="", font=('Arial', 10))
        self.data_info_label.pack(side=tk.RIGHT)

        self.update_data_info()
        """Create the menu preview section."""

    def create_category_preview(self, parent):
        """Create the category preview section."""

        preview_frame = ttk.LabelFrame(parent, text="Category Preview", padding=10)
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # Category selector
        category_frame = ttk.Frame(preview_frame)
        category_frame.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(category_frame, text="Category:").pack(side=tk.LEFT, padx=(0, 5))

        self.category_var = tk.StringVar()
        self.category_combo = ttk.Combobox(category_frame, textvariable=self.category_var,
                                         state="readonly", width=30)
        self.category_combo.pack(side=tk.LEFT, padx=(0, 10))
        self.category_combo.bind('<<ComboboxSelected>>', self.on_category_changed)

        # Navigation buttons
        ttk.Button(category_frame, text="◀", command=self.prev_category, width=3).pack(side=tk.LEFT, padx=2)
        ttk.Button(category_frame, text="▶", command=self.next_category, width=3).pack(side=tk.LEFT, padx=2)

        # Instructions
        instructions = ttk.Label(category_frame, text="Left-click: Select for regeneration | Right-click: Preview image | Double-click: Quick regenerate",
                                font=('Arial', 9), foreground=self.colors['secondary'])
        instructions.pack(side=tk.RIGHT, padx=(10, 0))

        # Items display
        items_frame = ttk.Frame(preview_frame)
        items_frame.pack(fill=tk.BOTH, expand=True)

        # Canvas for menu items
        self.canvas = tk.Canvas(items_frame, bg=self.colors['background'], highlightthickness=0)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Scrollbar
        scrollbar = ttk.Scrollbar(items_frame, orient=tk.VERTICAL, command=self.canvas.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.canvas.configure(yscrollcommand=scrollbar.set)

        # Bind canvas events
        self.canvas.bind('<Configure>', self.on_canvas_configure)

        # Update section list
        self.update_category_list()

    def create_control_panel(self, parent):
        """Create the control panel section."""

        control_frame = ttk.LabelFrame(parent, text="Controls", padding=10)
        control_frame.pack(fill=tk.X, pady=(0, 10))

        # Top row - Generation controls
        gen_frame = ttk.Frame(control_frame)
        gen_frame.pack(fill=tk.X, pady=(0, 10))

        ttk.Button(gen_frame, text="Generate All Icons",
                  command=self.generate_all_icons).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(gen_frame, text="Generate Selected",
                  command=self.generate_selected_icons).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(gen_frame, text="Clear All",
                  command=self.clear_all_icons).pack(side=tk.LEFT, padx=(0, 5))

        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(gen_frame, variable=self.progress_var,
                                           maximum=100, length=200)
        self.progress_bar.pack(side=tk.RIGHT, padx=(10, 0))

        # Selected items display
        selected_frame = ttk.Frame(control_frame)
        selected_frame.pack(fill=tk.X)

        ttk.Label(selected_frame, text="Selected for regeneration:").pack(anchor=tk.W)

        self.selected_listbox = tk.Listbox(selected_frame, height=4, selectmode=tk.MULTIPLE)
        self.selected_listbox.pack(fill=tk.X, pady=(5, 0))

    def create_status_panel(self, parent):
        """Create the status panel section."""

        status_frame = ttk.LabelFrame(parent, text="Status & Output", padding=10)
        status_frame.pack(fill=tk.BOTH, expand=True)

        # Status text
        self.status_text = scrolledtext.ScrolledText(status_frame, height=8, width=80)
        self.status_text.pack(fill=tk.BOTH, expand=True)

        # Action buttons
        button_frame = ttk.Frame(status_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))

        ttk.Button(button_frame, text="Save Category Data",
                  command=self.save_category_data).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Export Icons",
                  command=self.export_icons).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Clear Status",
                  command=self.clear_status).pack(side=tk.RIGHT)

    def setup_gemini_client(self):
        """Setup the Gemini client."""
        if not os.environ.get("GEMINI_API_KEY"):
            self.log_status("Warning: GEMINI_API_KEY environment variable not set", "warning")
            return

        try:
            self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            self.log_status("Gemini client initialized successfully", "success")
        except Exception as e:
            self.log_status(f"Error initializing Gemini client: {e}", "error")

    def generate_category_data(self) -> List[Dict[str, Any]]:
        """Generate category data from mobile app categories."""
        return [
            {
                "id": "future-baby",
                "title": "Future Baby with AI",
                "emoji": "🍼",
                "description": "See what your future baby might look like",
                "subcategories": ["All", "Realistic", "Artistic", "Ethnic"],
                "items": [
                    {"id": "baby-prediction", "title": "Baby Prediction", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=baby1", "imagePath": "assets/categories/baby-prediction.png", "isPremium": True},
                    {"id": "family-preview", "title": "Family Preview", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=family1", "imagePath": "assets/categories/family-preview.png", "isPremium": True},
                    {"id": "child-generator", "title": "Child Generator", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=child1", "imagePath": "assets/categories/child-generator.png", "isPremium": True},
                    {"id": "twins-prediction", "title": "Twins Prediction", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=twins1", "imagePath": "assets/categories/twins-prediction.png"},
                    {"id": "baby-mix", "title": "Baby Mix", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=mix1", "imagePath": "assets/categories/baby-mix.png"},
                    {"id": "future-child", "title": "Future Child", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=future1", "imagePath": "assets/categories/future-child.png"},
                ],
            },
            {
                "id": "outfit-tryon",
                "title": "Choose Your Outfit",
                "emoji": "👕",
                "description": "Try different outfits on your photos",
                "subcategories": ["All", "Casual", "Business", "Evening"],
                "items": [
                    {"id": "casual-wear", "title": "Casual Wear", "category": "Fashion", "imageUrl": "https://picsum.photos/300/400?random=casual1", "imagePath": "assets/categories/casual-wear.png"},
                    {"id": "business-attire", "title": "Business Attire", "category": "Fashion", "imageUrl": "https://picsum.photos/300/400?random=business1", "imagePath": "assets/categories/business-attire.png", "isPremium": True},
                    {"id": "evening-dress", "title": "Evening Dress", "category": "Fashion", "imageUrl": "https://picsum.photos/300/400?random=evening1", "imagePath": "assets/categories/evening-dress.png", "isPremium": True},
                    {"id": "street-style", "title": "Street Style", "category": "Fashion", "imageUrl": "https://picsum.photos/300/400?random=street1", "imagePath": "assets/categories/street-style.png"},
                    {"id": "summer-look", "title": "Summer Look", "category": "Fashion", "imageUrl": "https://picsum.photos/300/400?random=summer1", "imagePath": "assets/categories/summer-look.png"},
                    {"id": "winter-fashion", "title": "Winter Fashion", "category": "Fashion", "imageUrl": "https://picsum.photos/300/400?random=winter1", "imagePath": "assets/categories/winter-fashion.png"},
                ],
            },
            {
                "id": "digital-twin",
                "title": "Digital Twin",
                "emoji": "🎭",
                "description": "Create your digital avatar",
                "subcategories": ["All", "3D Model", "Anime", "Sci-Fi"],
                "items": [
                    {"id": "3d-avatar", "title": "3D Avatar", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=avatar1", "imagePath": "assets/categories/3d-avatar.png", "isPremium": True},
                    {"id": "virtual-clone", "title": "Virtual Clone", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=clone1", "imagePath": "assets/categories/virtual-clone.png", "isPremium": True},
                    {"id": "digital-persona", "title": "Digital Persona", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=persona1", "imagePath": "assets/categories/digital-persona.png", "isPremium": True},
                    {"id": "cartoon-version", "title": "Cartoon Version", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=cartoon1", "imagePath": "assets/categories/cartoon-version.png"},
                    {"id": "pixel-art", "title": "Pixel Art", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=pixel1", "imagePath": "assets/categories/pixel-art.png"},
                    {"id": "realistic-twin", "title": "Realistic Twin", "category": "AI", "imageUrl": "https://picsum.photos/300/400?random=realistic1", "imagePath": "assets/categories/realistic-twin.png"},
                ],
            },
        ]

    def generate_video_data(self) -> List[Dict[str, Any]]:
        """Generate video categories data from AIVideosScreen."""
        return [
            {
                "id": "animate-old-photos",
                "title": "Animate Old Photos",
                "emoji": "📹",
                "description": "Bring your old photos to life with AI animation",
                "items": [
                    {"id": "face-animation", "title": "Face Animation", "duration": "0:15", "isPremium": True, "imageUrl": "https://picsum.photos/300/169?random=video1", "imagePath": "assets/videos/face-animation.png"},
                    {"id": "subtle-motion", "title": "Subtle Motion", "duration": "0:10", "imageUrl": "https://picsum.photos/300/169?random=video2", "imagePath": "assets/videos/subtle-motion.png"},
                    {"id": "expression-changes", "title": "Expression Changes", "duration": "0:20", "imageUrl": "https://picsum.photos/300/169?random=video3", "imagePath": "assets/videos/expression-changes.png"},
                ],
            },
            {
                "id": "cinemagraphs",
                "title": "Cinemagraphs",
                "emoji": "🌊",
                "description": "Create stunning living photographs with subtle motion",
                "items": [
                    {"id": "water-flow", "title": "Water Flow", "duration": "0:30", "imageUrl": "https://picsum.photos/300/169?random=cinema1", "imagePath": "assets/videos/water-flow.png"},
                    {"id": "hair-movement", "title": "Hair Movement", "duration": "0:15", "imageUrl": "https://picsum.photos/300/169?random=cinema2", "imagePath": "assets/videos/hair-movement.png"},
                    {"id": "cloud-motion", "title": "Cloud Motion", "duration": "0:45", "isPremium": True, "imageUrl": "https://picsum.photos/300/169?random=cinema3", "imagePath": "assets/videos/cloud-motion.png"},
                ],
            },
            {
                "id": "portrait-animation",
                "title": "Portrait Animation",
                "emoji": "😊",
                "description": "Animate portraits with natural expressions and movements",
                "items": [
                    {"id": "smile-animation", "title": "Smile Animation", "duration": "0:10", "imageUrl": "https://picsum.photos/300/169?random=portrait1", "imagePath": "assets/videos/smile-animation.png"},
                    {"id": "talking-effect", "title": "Talking Effect", "duration": "0:25", "isPremium": True, "imageUrl": "https://picsum.photos/300/169?random=portrait2", "imagePath": "assets/videos/talking-effect.png"},
                    {"id": "eye-movement", "title": "Eye Movement", "duration": "0:15", "imageUrl": "https://picsum.photos/300/169?random=portrait3", "imagePath": "assets/videos/eye-movement.png"},
                ],
            },
            {
                "id": "background-animation",
                "title": "Background Animation",
                "emoji": "🎬",
                "description": "Add animated backgrounds to your photos",
                "items": [
                    {"id": "sky-changes", "title": "Sky Changes", "duration": "0:45", "imageUrl": "https://picsum.photos/300/169?random=bg1", "imagePath": "assets/videos/sky-changes.png"},
                    {"id": "weather-effects", "title": "Weather Effects", "duration": "0:30", "isPremium": True, "imageUrl": "https://picsum.photos/300/169?random=bg2", "imagePath": "assets/videos/weather-effects.png"},
                    {"id": "light-transitions", "title": "Light Transitions", "duration": "1:00", "imageUrl": "https://picsum.photos/300/169?random=bg3", "imagePath": "assets/videos/light-transitions.png"},
                ],
            },
        ]

    def update_data_info(self):
        """Update the data info label."""
        if self.current_data_type == 'categories':
            info_text = f"{len(self.category_data)} categories with {sum(len(c['items']) for c in self.category_data)} total items"
        else:
            info_text = f"{len(self.video_data)} video categories with {sum(len(c['items']) for c in self.video_data)} total items"
        self.data_info_label.config(text=info_text)

    def on_data_type_changed(self):
        """Handle data type change."""
        self.current_data_type = self.data_type_var.get()
        self.current_category_index = 0
        self.update_data_info()
        self.update_category_list()

    def update_category_list(self):
        """Update the category dropdown list."""
        if self.current_data_type == 'categories':
            data = self.category_data
        else:
            data = self.video_data

        category_titles = [c['title'] for c in data]
        self.category_combo['values'] = category_titles
        if category_titles:
            self.category_combo.set(category_titles[0])
            self.display_category_items()

    def on_category_changed(self, event):
        """Handle category selection change."""
        self.display_category_items()

    def prev_category(self):
        """Navigate to previous category."""
        data = self.category_data if self.current_data_type == 'categories' else self.video_data
        if self.current_category_index > 0:
            self.current_category_index -= 1
            self.category_combo.current(self.current_category_index)
            self.display_category_items()

    def next_category(self):
        """Navigate to next category."""
        data = self.category_data if self.current_data_type == 'categories' else self.video_data
        if self.current_category_index < len(data) - 1:
            self.current_category_index += 1
            self.category_combo.current(self.current_category_index)
            self.display_category_items()

    def display_category_items(self):
        """Display items for the selected category."""
        self.canvas.delete("all")

        selected_category = self.category_combo.get()
        data = self.category_data if self.current_data_type == 'categories' else self.video_data
        category = next((c for c in data if c['title'] == selected_category), None)

        if not category:
            return

        # Get items for this category
        items = category['items']

        # Display items in grid layout
        canvas_width = self.canvas.winfo_width()
        if canvas_width <= 1:
            canvas_width = 800

        item_width = 150
        item_height = 150
        padding = 20
        columns = max(1, (canvas_width - padding * 2) // (item_width + padding))

        y_offset = 20

        # Category header
        self.canvas.create_text(padding, y_offset, text=f"{category['emoji']} {category['title']}",
                               fill='white', font=('Arial', 18, 'bold'), anchor='w')
        y_offset += 40

        if category['description']:
            self.canvas.create_text(padding, y_offset, text=category['description'],
                                   fill=self.colors['secondary'], font=('Arial', 12), anchor='w')
            y_offset += 30

        # Item count
        item_count_text = f"{len(items)} items"
        if self.current_data_type == 'videos':
            item_count_text = f"{len(items)} videos"
        self.canvas.create_text(padding, y_offset, text=item_count_text,
                               fill=self.colors['accent'], font=('Arial', 10), anchor='w')
        y_offset += 20

        # Items grid
        for i, item in enumerate(items):
            row = i // columns
            col = i % columns

            x = padding + col * (item_width + padding)
            y = y_offset + row * (item_height + padding)

            self.create_category_item_widget(x, y, item_width, item_height, item)

        # Update canvas scroll region
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def create_category_item_widget(self, x, y, width, height, item):
        """Create a category item widget on the canvas."""

        # Background
        bg_color = self.colors['surface']
        if item.get('is_premium'):
            bg_color = '#2D2D30'  # Slightly different for premium

        rect = self.canvas.create_rectangle(x, y, x + width, y + height,
                                          fill=bg_color, outline=self.colors['primary'], width=2,
                                          tags=f"item_{item['id']}")

        # Icon or image status
        icon_y = y + 20
        if item['id'] in self.generated_icons:
            # Display generated icon
            try:
                icon_image = self.generated_icons[item['id']]
                icon_photo = ImageTk.PhotoImage(icon_image)
                self.canvas.create_image(x + width//2, icon_y, image=icon_photo,
                                       tags=f"icon_{item['id']}")
                # Keep reference to prevent garbage collection
                self.canvas.icon_photo = icon_photo

                # Add "EXISTS" indicator
                self.canvas.create_text(x + width//2, icon_y + 35, text="✓ EXISTS",
                                       fill=self.colors['success'], font=('Arial', 8, 'bold'))
            except Exception as e:
                self.log_status(f"Error displaying icon for {item['id']}: {e}", "error")
                # Fallback to emoji with error indicator
                self.canvas.create_text(x + width//2, icon_y, text=item['icon'],
                                       fill='white', font=('Arial', 24))
                self.canvas.create_text(x + width//2, icon_y + 35, text="❌ ERROR",
                                       fill=self.colors['warning'], font=('Arial', 8, 'bold'))
        else:
            # Display emoji icon with "NOT EXISTS" indicator
            emoji_icon = item.get('emoji', '📷')
            if self.current_data_type == 'categories':
                emoji_icon = item.get('emoji', '📷')
            else:
                # For videos, use a default video emoji or derive from title
                emoji_icon = '🎬'

            self.canvas.create_text(x + width//2, icon_y, text=emoji_icon,
                                   fill='white', font=('Arial', 24))
            self.canvas.create_text(x + width//2, icon_y + 35, text="✗ NOT EXISTS",
                                   fill=self.colors['secondary'], font=('Arial', 8, 'bold'))

        # Title
        title_y = y + 60
        self.canvas.create_text(x + width//2, title_y, text=item['title'],
                               fill='white', font=('Arial', 12, 'bold'), width=width-20)

        # Additional info (category or duration)
        info_y = y + 85
        if self.current_data_type == 'categories' and 'category' in item:
            info_text = item['category']
        elif self.current_data_type == 'videos' and 'duration' in item:
            info_text = item['duration']
        else:
            # Use description if available, otherwise use a short title or category
            if 'description' in item:
                info_text = item['description'][:50] + '...' if len(item['description']) > 50 else item['description']
            elif 'category' in item:
                info_text = item['category']
            else:
                info_text = item['title'][:30] + '...' if len(item['title']) > 30 else item['title']

        self.canvas.create_text(x + width//2, info_y, text=info_text,
                               fill=self.colors['secondary'], font=('Arial', 9), width=width-20)

        # Premium badge
        if item.get('is_premium'):
            badge_x = x + width - 25
            badge_y = y + 10
            self.canvas.create_oval(badge_x - 10, badge_y - 10, badge_x + 10, badge_y + 10,
                                   fill=self.colors['accent'], outline='')
            self.canvas.create_text(badge_x, badge_y, text='PRO',
                                   fill='white', font=('Arial', 8, 'bold'))

        # Bind click events
        self.canvas.tag_bind(f"item_{item['id']}", '<Button-1>',
                           lambda e, item=item: self.on_item_click(item))
        self.canvas.tag_bind(f"item_{item['id']}", '<Button-3>',
                           lambda e, item=item: self.on_item_right_click(item))
        self.canvas.tag_bind(f"item_{item['id']}", '<Double-Button-1>',
                           lambda e, item=item: self.on_item_double_click(item))

        # Bind hover effects
        self.canvas.tag_bind(f"item_{item['id']}", '<Enter>',
                           lambda e, rect=rect: self.on_item_hover(rect, True))
        self.canvas.tag_bind(f"item_{item['id']}", '<Leave>',
                           lambda e, rect=rect: self.on_item_hover(rect, False))

    def on_item_click(self, item):
        """Handle category item click."""
        # Toggle selection for regeneration
        emoji_icon = item.get('emoji', '📷')
        if self.current_data_type == 'categories':
            emoji_icon = item.get('emoji', '📷')
        else:
            emoji_icon = '🎬'
        selection_text = f"{item['title']} ({emoji_icon})"

        # Check if already selected
        selected_items = list(self.selected_listbox.get(0, tk.END))
        if selection_text in selected_items:
            index = selected_items.index(selection_text)
            self.selected_listbox.delete(index)
        else:
            self.selected_listbox.insert(tk.END, selection_text)

        self.log_status(f"Selected {item['title']} for regeneration", "info")

    def on_item_right_click(self, item):
        """Handle right-click on menu item."""
        # Show image preview if exists
        if item['id'] in self.generated_icons:
            self.show_image_preview(item)
        else:
            messagebox.showinfo("No Image", f"No image exists for {item['title']}\n\nLeft-click to select for regeneration, then click 'Generate Selected'.")

    def on_item_double_click(self, item):
        """Handle double-click on menu item."""
        # Quick regenerate this single item
        self.quick_regenerate_item(item)

    def show_image_preview(self, item):
        """Show a preview window with the item's image."""
        if self.preview_window:
            self.preview_window.destroy()

        self.preview_window = tk.Toplevel(self.root)
        self.preview_window.title(f"Image Preview - {item['title']}")
        self.preview_window.geometry("400x450")

        # Create preview frame
        preview_frame = ttk.Frame(self.preview_window, padding="20")
        preview_frame.pack(fill=tk.BOTH, expand=True)

        # Title
        title_label = ttk.Label(preview_frame, text=item['title'], font=('Arial', 16, 'bold'))
        title_label.pack(pady=(0, 10))

        # Description
        desc_label = ttk.Label(preview_frame, text=item['description'], font=('Arial', 10))
        desc_label.pack(pady=(0, 20))

        # Image
        try:
            icon_image = self.generated_icons[item['id']]
            # Resize for preview (larger)
            preview_image = icon_image.resize((128, 128), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(preview_image)

            image_label = ttk.Label(preview_frame, image=photo)
            image_label.image = photo  # Keep reference
            image_label.pack(pady=(0, 20))
        except Exception as e:
            error_label = ttk.Label(preview_frame, text=f"Error loading image: {e}", foreground='red')
            error_label.pack(pady=(0, 20))

        # Image info
        info_frame = ttk.Frame(preview_frame)
        info_frame.pack(fill=tk.X, pady=(0, 20))

        ttk.Label(info_frame, text="Image Information:", font=('Arial', 12, 'bold')).pack(anchor=tk.W)
        ttk.Label(info_frame, text=f"Item ID: {item['id']}").pack(anchor=tk.W)
        ttk.Label(info_frame, text=f"Size: 64x64 pixels").pack(anchor=tk.W)
        ttk.Label(info_frame, text=f"Format: PNG").pack(anchor=tk.W)

        # Buttons
        button_frame = ttk.Frame(preview_frame)
        button_frame.pack(fill=tk.X)

        ttk.Button(button_frame, text="Regenerate",
                  command=lambda: self.regenerate_from_preview(item)).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Export Image",
                  command=lambda: self.export_single_image(item)).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Close",
                  command=self.preview_window.destroy).pack(side=tk.RIGHT)

    def regenerate_from_preview(self, item):
        """Regenerate image from preview window."""
        self.preview_window.destroy()
        self.quick_regenerate_item(item)

    def export_single_image(self, item):
        """Export a single image."""
        if item['id'] not in self.generated_icons:
            messagebox.showwarning("No Image", "No image to export")
            return

        filename = filedialog.asksaveasfilename(
            defaultextension=".png",
            initialfile=f"icon_{item['id']}.png",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
        )

        if filename:
            try:
                self.generated_icons[item['id']].save(filename, "PNG")
                self.log_status(f"Exported {item['title']} icon to {filename}", "success")
                messagebox.showinfo("Success", f"Image exported to {filename}")
            except Exception as e:
                self.log_status(f"Error exporting image: {e}", "error")
                messagebox.showerror("Error", f"Failed to export image: {e}")

    def quick_regenerate_item(self, item):
        """Quick regenerate a single item."""
        if not self.client:
            messagebox.showerror("Error", "Gemini client not initialized")
            return

        if self.is_generating:
            messagebox.showwarning("Warning", "Generation already in progress")
            return

        self.is_generating = True
        self.progress_var.set(0)

        # Start generation in separate thread
        thread = threading.Thread(target=self._quick_regenerate_thread, args=(item,))
        thread.daemon = True
        thread.start()

        self.log_status(f"Quick regenerating {item['title']}...", "info")

    def _quick_regenerate_thread(self, item):
        """Quick regenerate single item in background thread."""
        try:
            self.log_status(f"Regenerating icon for {item['title']}")

            # Generate icon
            icon = self.generate_single_icon(item)
            if icon:
                self.generated_icons[item['id']] = icon
                self.root.after(0, lambda item=item: self.update_category_item_display(item))
                self.root.after(0, lambda: self.log_status(f"Successfully regenerated {item['title']} icon", "success"))
            else:
                self.root.after(0, lambda: self.log_status(f"Failed to regenerate {item['title']} icon", "error"))

        except Exception as e:
            self.root.after(0, lambda: self.log_status(f"Error regenerating {item['title']}: {e}", "error"))
        finally:
            self.is_generating = False
            self.root.after(0, lambda: self.progress_var.set(0))

    def on_item_hover(self, rect, is_hover):
        """Handle menu item hover effect."""
        color = self.colors['primary'] if is_hover else self.colors['primary']
        width = 3 if is_hover else 2
        self.canvas.itemconfig(rect, outline=color, width=width)

    def on_canvas_configure(self, event):
        """Handle canvas resize."""
        self.display_category_items()

    def generate_all_icons(self):
        """Generate icons for all menu items."""
        if not self.client:
            messagebox.showerror("Error", "Gemini client not initialized")
            return

        if self.is_generating:
            messagebox.showwarning("Warning", "Generation already in progress")
            return

        self.is_generating = True
        self.progress_var.set(0)

        # Start generation in separate thread
        thread = threading.Thread(target=self._generate_all_icons_thread)
        thread.daemon = True
        thread.start()

    def _generate_all_icons_thread(self):
        """Generate all icons in background thread."""
        try:
            # Get all items from current data type
            if self.current_data_type == 'categories':
                all_items = [item for category in self.category_data for item in category['items']]
            else:
                all_items = [item for category in self.video_data for item in category['items']]

            total_items = len(all_items)

            for i, item in enumerate(all_items):
                self.log_status(f"Generating icon for {item['title']} ({i+1}/{total_items})")

                # Generate icon
                icon = self.generate_single_icon(item)
                if icon:
                    self.generated_icons[item['id']] = icon
                    self.root.after(0, lambda item=item: self.update_category_item_display(item))

                # Update progress
                progress = ((i + 1) / total_items) * 100
                self.root.after(0, lambda p=progress: self.progress_var.set(p))

            self.root.after(0, lambda: self.log_status("All icons generated successfully!", "success"))

        except Exception as e:
            self.root.after(0, lambda: self.log_status(f"Error generating icons: {e}", "error"))
        finally:
            self.is_generating = False
            self.root.after(0, lambda: self.progress_var.set(0))

    def generate_selected_icons(self):
        """Generate icons for selected items."""
        if not self.client:
            messagebox.showerror("Error", "Gemini client not initialized")
            return

        selected_indices = self.selected_listbox.curselection()
        if not selected_indices:
            messagebox.showwarning("Warning", "No items selected for regeneration")
            return

        if self.is_generating:
            messagebox.showwarning("Warning", "Generation already in progress")
            return

        self.is_generating = True
        self.progress_var.set(0)

        # Start generation in separate thread
        thread = threading.Thread(target=self._generate_selected_icons_thread,
                               args=(selected_indices,))
        thread.daemon = True
        thread.start()

    def _generate_selected_icons_thread(self, selected_indices):
        """Generate selected icons in background thread."""
        try:
            total_selected = len(selected_indices)

            for i, index in enumerate(selected_indices):
                selected_text = self.selected_listbox.get(index)
                # Parse item title from selection text
                item_title = selected_text.split(' (')[0]

                # Find the item across all categories
                if self.current_data_type == 'categories':
                    all_items = [item for category in self.category_data for item in category['items']]
                else:
                    all_items = [item for category in self.video_data for item in category['items']]

                item = next((item for item in all_items if item['title'] == item_title), None)

                if item:
                    self.log_status(f"Regenerating icon for {item['title']} ({i+1}/{total_selected})")

                    # Generate icon
                    icon = self.generate_single_icon(item)
                    if icon:
                        self.generated_icons[item['id']] = icon
                        self.root.after(0, lambda item=item: self.update_category_item_display(item))

                    # Update progress
                    progress = ((i + 1) / total_selected) * 100
                    self.root.after(0, lambda p=progress: self.progress_var.set(p))

            self.root.after(0, lambda: self.log_status("Selected icons regenerated successfully!", "success"))

        except Exception as e:
            self.root.after(0, lambda: self.log_status(f"Error regenerating icons: {e}", "error"))
        finally:
            self.is_generating = False
            self.root.after(0, lambda: self.progress_var.set(0))

    def generate_single_icon(self, item):
        """Generate a single icon for a category item."""
        try:
            # Create prompt for this specific icon based on data type
            if self.current_data_type == 'categories':
                prompt = f"""Generate a modern, clean 64x64 pixel icon for a mobile app category item.

Category Item: {item['title']}
Category: {item.get('category', 'AI')}
Description: {item.get('description', f'AI-powered {item["title"]} feature')}

Requirements:
- 64x64 pixels, PNG format
- Modern, minimalist design
- Clean lines and simple shapes
- Transparent background
- Use subtle colors (blues, purples, or accent colors)
- Should be recognizable at small sizes
- Represent the AI function visually
- For '{item['title']}', focus on {item['title'].lower()} visualization

Please generate just this one icon with no additional text or descriptions."""
            else:
                # Video items
                prompt = f"""Generate a modern, clean 64x64 pixel icon for a mobile app video effect.

Video Effect: {item['title']}
Duration: {item.get('duration', '0:30')}
Type: AI video animation/processing

Requirements:
- 64x64 pixels, PNG format
- Modern, minimalist design
- Clean lines and simple shapes
- Transparent background
- Use subtle colors (blues, purples, or accent colors)
- Should be recognizable at small sizes
- Represent the video effect visually
- For '{item['title']}', focus on {item['title'].lower()} animation concept

Please generate just this one icon with no additional text or descriptions."""

            # Generate content
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-image-preview",
                contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
                config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])
            )

            # Extract image from response
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    image_data = part.inline_data.data

                    # Convert to PIL Image
                    image = Image.open(io.BytesIO(image_data))

                    # Resize to 64x64 if needed
                    if image.size != (64, 64):
                        image = image.resize((64, 64), Image.Resampling.LANCZOS)

                    return image

        except Exception as e:
            self.log_status(f"Error generating icon for {item['title']}: {e}", "error")

        return None

    def update_category_item_display(self, item):
        """Update the display of a specific category item."""
        self.display_category_items()

    def clear_all_icons(self):
        """Clear all generated icons."""
        if messagebox.askyesno("Confirm", "Clear all generated icons?"):
            self.generated_icons.clear()
            self.selected_listbox.delete(0, tk.END)
            self.display_category_items()
            self.log_status("All icons cleared", "info")

    def load_existing_icons(self):
        """Load existing icons from the assets directory."""
        assets_dir = "generated_category_assets"
        if os.path.exists(assets_dir):
            for filename in os.listdir(assets_dir):
                if filename.startswith('icon_') and filename.endswith('.png'):
                    try:
                        image_path = os.path.join(assets_dir, filename)
                        image = Image.open(image_path)
                        # Extract item ID from filename
                        item_id = filename.replace('icon_', '').replace('.png', '')
                        self.generated_icons[item_id] = image
                    except Exception as e:
                        self.log_status(f"Error loading icon {filename}: {e}", "error")

            if self.generated_icons:
                self.display_category_items()
                self.log_status(f"Loaded {len(self.generated_icons)} existing icons", "success")

    def save_category_data(self):
        """Save the current category data with image paths."""
        filename = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )

        if filename:
            try:
                # Create category data with image paths
                data = self.category_data if self.current_data_type == 'categories' else self.video_data
                data_with_paths = [category.copy() for category in data]

                # Add image paths to items
                for category in data_with_paths:
                    category['items'] = [item.copy() for item in category['items']]
                    for item in category['items']:
                        if item['id'] in self.generated_icons:
                            item['generatedImagePath'] = f"generated_category_assets/icon_{item['id']}.png"

                with open(filename, 'w') as f:
                    json.dump(data_with_paths, f, indent=2)

                data_type_name = "Category" if self.current_data_type == 'categories' else "Video"
                self.log_status(f"{data_type_name} data saved to {filename}", "success")
                messagebox.showinfo("Success", f"{data_type_name} data saved to {filename}")

            except Exception as e:
                self.log_status(f"Error saving category data: {e}", "error")
                messagebox.showerror("Error", f"Failed to save category data: {e}")

    def export_icons(self):
        """Export all generated icons to a directory."""
        if not self.generated_icons:
            messagebox.showwarning("Warning", "No icons to export")
            return

        directory = filedialog.askdirectory(title="Select export directory")

        if directory:
            try:
                export_count = 0
                for item_id, image in self.generated_icons.items():
                    filename = f"icon_{item_id}.png"
                    filepath = os.path.join(directory, filename)
                    image.save(filepath, "PNG")
                    export_count += 1

                self.log_status(f"Exported {export_count} icons to {directory}", "success")
                messagebox.showinfo("Success", f"Exported {export_count} icons to {directory}")

            except Exception as e:
                self.log_status(f"Error exporting icons: {e}", "error")
                messagebox.showerror("Error", f"Failed to export icons: {e}")

    def log_status(self, message, level="info"):
        """Log a status message."""
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")

        # Color coding
        colors = {
            "info": "",
            "success": "green",
            "warning": "orange",
            "error": "red"
        }

        color = colors.get(level, "")
        formatted_message = f"[{timestamp}] {message}\n"

        self.status_text.insert(tk.END, formatted_message)
        self.status_text.see(tk.END)

        # Apply color if supported
        if color:
            self.status_text.tag_add(color, f"end-{len(formatted_message)}c", "end-1c")
            self.status_text.tag_config(color, foreground=color)

    def clear_status(self):
        """Clear the status text."""
        self.status_text.delete(1.0, tk.END)


def main():
    """Main function."""
    root = tk.Tk()
    app = CategoryAssetGeneratorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()