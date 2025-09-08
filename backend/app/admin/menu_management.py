from sqladmin import BaseView, expose
from fastapi import Request, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models.database import get_db, MenuSection, MenuItem
from ..utils.menu_seeder import seed_menu_data_if_needed, clear_all_menu_data
from jinja2 import Template
import json
import logging

logger = logging.getLogger(__name__)

class MenuManagementView(BaseView):
    name = "Menu Management"
    icon = "fa-solid fa-sitemap"
    category = "Management"
    
    def __init__(self):
        super().__init__()
        
    @expose("/menu-management", methods=["GET"])
    async def menu_management(self, request: Request) -> Response:
        """Main menu management dashboard"""
        db = next(get_db())
        try:
            # Get all menu sections with their items
            sections = db.query(MenuSection).filter(MenuSection.is_active == True).order_by(MenuSection.sort_order).all()
            
            # Get menu items for each section
            menu_data = []
            for section in sections:
                items = db.query(MenuItem).filter(MenuItem.section_id == section.id, MenuItem.is_active == True).order_by(MenuItem.sort_order).all()
                menu_data.append({
                    'section': section,
                    'items': items
                })
            
            # Get statistics
            total_sections = db.query(MenuSection).count()
            total_items = db.query(MenuItem).count()
            active_items = db.query(MenuItem).filter(MenuItem.is_active == True).count()
            premium_items = db.query(MenuItem).filter(MenuItem.is_premium == True).count()
            
            stats = {
                'total_sections': total_sections,
                'total_items': total_items,
                'active_items': active_items,
                'premium_items': premium_items
            }
            
            return self._render_template("menu_management.html", {
                "menu_data": menu_data,
                "stats": stats,
                "request": request
            })
            
        except Exception as e:
            logger.error(f"Error in menu management: {e}")
            return HTMLResponse(content=f"<div class='alert alert-danger'>Error: {str(e)}</div>")
        finally:
            db.close()
    
    @expose("/load-demo-data", methods=["POST"])
    async def load_demo_data(self, request: Request) -> Response:
        """Load demo menu data"""
        try:
            # Clear existing data
            clear_all_menu_data()
            
            # Seed new data
            seed_menu_data_if_needed()
            
            return RedirectResponse(
                url="/admin/menu-management/menu-management?message=Demo data loaded successfully",
                status_code=303
            )
        except Exception as e:
            logger.error(f"Error loading demo data: {e}")
            return RedirectResponse(
                url=f"/admin/menu-management/menu-management?error=Failed to load demo data: {str(e)}",
                status_code=303
            )
    
    @expose("/clear-menu-data", methods=["POST"])
    async def clear_menu_data(self, request: Request) -> Response:
        """Clear all menu data"""
        try:
            clear_all_menu_data()
            
            return RedirectResponse(
                url="/admin/menu-management/menu-management?message=All menu data cleared successfully",
                status_code=303
            )
        except Exception as e:
            logger.error(f"Error clearing menu data: {e}")
            return RedirectResponse(
                url=f"/admin/menu-management/menu-management?error=Failed to clear menu data: {str(e)}",
                status_code=303
            )
    
    @expose("/preview-menu", methods=["GET"])
    async def preview_menu(self, request: Request) -> Response:
        """Preview menu as JSON"""
        db = next(get_db())
        try:
            sections = db.query(MenuSection).filter(MenuSection.is_active == True).order_by(MenuSection.sort_order).all()
            
            menu_data = []
            for section in sections:
                items = db.query(MenuItem).filter(MenuItem.section_id == section.id, MenuItem.is_active == True).order_by(MenuItem.sort_order).all()
                
                section_data = {
                    'id': section.id,
                    'name': section.name,
                    'title': section.title,
                    'description': section.description,
                    'icon': section.icon,
                    'layout': section.layout,
                    'sort_order': section.sort_order,
                    'is_active': section.is_active,
                    'meta_data': section.meta_data,
                    'items': []
                }
                
                for item in items:
                    section_data['items'].append({
                        'id': item.id,
                        'title': item.title,
                        'description': item.description,
                        'icon': item.icon,
                        'action_type': item.action_type,
                        'action_value': item.action_value,
                        'section_id': item.section_id,
                        'parent_id': item.parent_id,
                        'sort_order': item.sort_order,
                        'is_active': item.is_active,
                        'is_premium': item.is_premium,
                        'requires_auth': item.requires_auth,
                        'meta_data': item.meta_data
                    })
                
                menu_data.append(section_data)
            
            return Response(
                content=json.dumps(menu_data, indent=2),
                media_type="application/json"
            )
            
        except Exception as e:
            logger.error(f"Error previewing menu: {e}")
            return Response(
                content=json.dumps({"error": str(e)}),
                media_type="application/json",
                status_code=500
            )
        finally:
            db.close()
    
    def _render_template(self, template_name: str, context: dict) -> HTMLResponse:
        """Render HTML template"""
        # Simple HTML template for menu management
        template_str = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu Management - Photo Restoration Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .menu-section {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .section-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #ddd;
        }
        .menu-item {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
        }
        .menu-item:last-child {
            border-bottom: none;
        }
        .premium-badge {
            background: #ffc107;
            color: #000;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        .auth-badge {
            background: #28a745;
            color: #fff;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        .stats-card {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .alert-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center my-4">
                    <h1><i class="fas fa-sitemap"></i> Menu Management</h1>
                    <div>
                        <form action="/admin/menu-management/load-demo-data" method="post" style="display: inline;">
                            <button type="submit" class="btn btn-primary" onclick="return confirm('This will replace all existing menu data with demo data. Continue?')">
                                <i class="fas fa-download"></i> Load Demo Data
                            </button>
                        </form>
                        <form action="/admin/menu-management/clear-menu-data" method="post" style="display: inline; margin-left: 10px;">
                            <button type="submit" class="btn btn-danger" onclick="return confirm('This will delete all menu data. This action cannot be undone. Continue?')">
                                <i class="fas fa-trash"></i> Clear All Data
                            </button>
                        </form>
                        <a href="/admin/menu-management/preview-menu" target="_blank" class="btn btn-info" style="margin-left: 10px;">
                            <i class="fas fa-eye"></i> Preview JSON
                        </a>
                    </div>
                </div>
                
                {% if request.query_params.get('message') %}
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    {{ request.query_params.get('message') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                {% endif %}
                
                {% if request.query_params.get('error') %}
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    {{ request.query_params.get('error') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                {% endif %}
                
                <!-- Statistics -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="stats-card text-center">
                            <h3 class="text-primary">{{ stats.total_sections }}</h3>
                            <p class="mb-0">Total Sections</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stats-card text-center">
                            <h3 class="text-success">{{ stats.total_items }}</h3>
                            <p class="mb-0">Total Items</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stats-card text-center">
                            <h3 class="text-info">{{ stats.active_items }}</h3>
                            <p class="mb-0">Active Items</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stats-card text-center">
                            <h3 class="text-warning">{{ stats.premium_items }}</h3>
                            <p class="mb-0">Premium Items</p>
                        </div>
                    </div>
                </div>
                
                <!-- Menu Sections -->
                <div class="row">
                    {% for section_data in menu_data %}
                    <div class="col-md-6">
                        <div class="menu-section">
                            <div class="section-header">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 class="mb-1">
                                            <i class="{{ section_data.section.icon }}"></i>
                                            {{ section_data.section.title }}
                                        </h4>
                                        <p class="mb-0 text-muted">{{ section_data.section.description }}</p>
                                        <small class="text-muted">
                                            Order: {{ section_data.section.sort_order }} | 
                                            Layout: {{ section_data.section.layout }} |
                                            Items: {{ section_data.items|length }}
                                        </small>
                                    </div>
                                    <div>
                                        <a href="/admin/menuitem/list?filters=section_id_eq_{{ section_data.section.id }}" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-edit"></i> Edit Items
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="section-items">
                                {% for item in section_data.items %}
                                <div class="menu-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{{ item.title }}</strong>
                                            <p class="mb-0 text-muted small">{{ item.description }}</p>
                                            <div>
                                                {% if item.is_premium %}
                                                <span class="premium-badge">Premium</span>
                                                {% endif %}
                                                {% if item.requires_auth %}
                                                <span class="auth-badge">Auth Required</span>
                                                {% endif %}
                                                <small class="text-muted ms-2">
                                                    {{ item.action_type }}: {{ item.action_value }}
                                                </small>
                                            </div>
                                        </div>
                                        <div>
                                            <span class="badge bg-secondary">{{ item.sort_order }}</span>
                                        </div>
                                    </div>
                                </div>
                                {% endfor %}
                                {% if section_data.items|length == 0 %}
                                <div class="menu-item text-muted text-center">
                                    <em>No items in this section</em>
                                </div>
                                {% endif %}
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
        """
        
        template = Template(template_str)
        html_content = template.render(**context)
        
        return HTMLResponse(content=html_content)