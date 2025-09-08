from sqladmin import BaseView, expose
from fastapi import Request, Response, Form, File, UploadFile
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ..models.database import get_db, MenuItem as MenuItemModel, MenuSection as MenuSectionModel
from jinja2 import Template
import json
import logging
import uuid
import os
from typing import Optional
import shutil
from datetime import datetime

logger = logging.getLogger(__name__)

class MenuItemCRUDView(BaseView):
    name = "Menu Items CRUD"
    icon = "fa-solid fa-bars"
    category = "Management"
    identity = "menu-items-crud"
    
    def __init__(self):
        super().__init__()
        # Create upload directory if it doesn't exist
        self.upload_dir = "uploads/menu_items"
        os.makedirs(self.upload_dir, exist_ok=True)
    
    @expose("/", methods=["GET"])
    async def index(self, request: Request) -> Response:
        """Redirect to main CRUD view"""
        return RedirectResponse(url="/admin/menu-items-crud/manage", status_code=302)
    
    @expose("/manage", methods=["GET"])
    async def manage(self, request: Request) -> Response:
        """Main menu item management interface"""
        db = next(get_db())
        try:
            # Get filter parameters
            section_id = request.query_params.get("section_id")
            search = request.query_params.get("search", "")
            
            # Base query
            query = db.query(MenuItemModel, MenuSectionModel).join(
                MenuSectionModel, MenuItemModel.section_id == MenuSectionModel.id
            )
            
            # Apply filters
            if section_id:
                query = query.filter(MenuItemModel.section_id == section_id)
            
            if search:
                query = query.filter(
                    (MenuItemModel.title.ilike(f"%{search}%")) |
                    (MenuItemModel.description.ilike(f"%{search}%"))
                )
            
            # Get menu items with their sections
            items = query.order_by(MenuItemModel.sort_order, MenuItemModel.created_at.desc()).all()
            
            # Get all sections for filter dropdown
            sections = db.query(MenuSectionModel).filter(MenuSectionModel.is_active == True).order_by(MenuSectionModel.sort_order).all()
            
            # Format data for template
            menu_items = []
            for item, section in items:
                menu_items.append({
                    'id': item.id,
                    'title': item.title,
                    'description': item.description,
                    'icon': item.icon,
                    'action_type': item.action_type,
                    'action_value': item.action_value,
                    'section_id': item.section_id,
                    'section_name': section.title if section else 'No Section',
                    'sort_order': item.sort_order,
                    'is_active': item.is_active,
                    'is_premium': item.is_premium,
                    'requires_auth': item.requires_auth,
                    'meta_data': item.meta_data or {},
                    'created_at': item.created_at,
                    'updated_at': item.updated_at
                })
            
            # Get statistics
            total_items = db.query(MenuItemModel).count()
            active_items = db.query(MenuItemModel).filter(MenuItemModel.is_active == True).count()
            premium_items = db.query(MenuItemModel).filter(MenuItemModel.is_premium == True).count()
            
            return self._render_template("menu_items_crud.html", {
                "menu_items": menu_items,
                "sections": sections,
                "stats": {
                    "total_items": total_items,
                    "active_items": active_items,
                    "premium_items": premium_items
                },
                "current_section_id": section_id,
                "current_search": search,
                "request": request
            })
            
        except Exception as e:
            logger.error(f"Error in menu items CRUD: {e}")
            return HTMLResponse(content=f"<div class='alert alert-danger'>Error: {str(e)}</div>")
        finally:
            db.close()
    
    @expose("/create", methods=["GET"])
    async def create_form(self, request: Request) -> Response:
        """Show create menu item form"""
        db = next(get_db())
        try:
            sections = db.query(MenuSectionModel).filter(MenuSectionModel.is_active == True).order_by(MenuSectionModel.sort_order).all()
            
            return self._render_template("menu_item_form.html", {
                "sections": sections,
                "item": None,
                "is_edit": False,
                "request": request
            })
            
        except Exception as e:
            logger.error(f"Error loading create form: {e}")
            return HTMLResponse(content=f"<div class='alert alert-danger'>Error: {str(e)}</div>")
        finally:
            db.close()
    
    @expose("/edit/{item_id}", methods=["GET"])
    async def edit_form(self, request: Request, item_id: str) -> Response:
        """Show edit menu item form"""
        db = next(get_db())
        try:
            item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
            if not item:
                return HTMLResponse(content="<div class='alert alert-danger'>Menu item not found</div>", status_code=404)
            
            sections = db.query(MenuSectionModel).filter(MenuSectionModel.is_active == True).order_by(MenuSectionModel.sort_order).all()
            
            return self._render_template("menu_item_form.html", {
                "sections": sections,
                "item": item,
                "is_edit": True,
                "request": request
            })
            
        except Exception as e:
            logger.error(f"Error loading edit form: {e}")
            return HTMLResponse(content=f"<div class='alert alert-danger'>Error: {str(e)}</div>")
        finally:
            db.close()
    
    @expose("/save", methods=["POST"])
    async def save_item(self, request: Request) -> Response:
        """Save or update menu item"""
        db = next(get_db())
        try:
            # Get form data
            form_data = await request.form()
            
            item_id = form_data.get("item_id")
            title = form_data.get("title")
            description = form_data.get("description")
            icon = form_data.get("icon")
            action_type = form_data.get("action_type")
            action_value = form_data.get("action_value")
            section_id = form_data.get("section_id")
            sort_order = int(form_data.get("sort_order", 0))
            is_active = form_data.get("is_active") == "on"
            is_premium = form_data.get("is_premium") == "on"
            requires_auth = form_data.get("requires_auth") == "on"
            
            # Handle file upload
            icon_file = form_data.get("icon_file")
            if icon_file and hasattr(icon_file, 'file'):
                # Save uploaded file
                file_extension = icon_file.filename.split('.')[-1]
                filename = f"{uuid.uuid4()}.{file_extension}"
                file_path = os.path.join(self.upload_dir, filename)
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(icon_file.file, buffer)
                
                icon = f"/{self.upload_dir}/{filename}"
            
            # Parse meta_data
            meta_data = {}
            if form_data.get("meta_data"):
                try:
                    meta_data = json.loads(form_data.get("meta_data"))
                except:
                    pass
            
            if item_id:
                # Update existing item
                item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
                if not item:
                    return HTMLResponse(content="<div class='alert alert-danger'>Menu item not found</div>", status_code=404)
                
                item.title = title
                item.description = description
                item.icon = icon
                item.action_type = action_type
                item.action_value = action_value
                item.section_id = section_id
                item.sort_order = sort_order
                item.is_active = is_active
                item.is_premium = is_premium
                item.requires_auth = requires_auth
                item.meta_data = meta_data
                item.updated_at = datetime.utcnow()
                
                message = "Menu item updated successfully"
            else:
                # Create new item
                item = MenuItemModel(
                    title=title,
                    description=description,
                    icon=icon,
                    action_type=action_type,
                    action_value=action_value,
                    section_id=section_id,
                    sort_order=sort_order,
                    is_active=is_active,
                    is_premium=is_premium,
                    requires_auth=requires_auth,
                    meta_data=meta_data
                )
                db.add(item)
                message = "Menu item created successfully"
            
            db.commit()
            
            return RedirectResponse(
                url=f"/admin/menu-items-crud/manage?message={message}",
                status_code=303
            )
            
        except Exception as e:
            logger.error(f"Error saving menu item: {e}")
            db.rollback()
            return HTMLResponse(content=f"<div class='alert alert-danger'>Error: {str(e)}</div>")
        finally:
            db.close()
    
    @expose("/delete/{item_id}", methods=["POST"])
    async def delete_item(self, request: Request, item_id: str) -> Response:
        """Delete menu item"""
        db = next(get_db())
        try:
            item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
            if not item:
                return HTMLResponse(content="<div class='alert alert-danger'>Menu item not found</div>", status_code=404)
            
            db.delete(item)
            db.commit()
            
            return RedirectResponse(
                url="/admin/menu-items-crud/manage?message=Menu item deleted successfully",
                status_code=303
            )
            
        except Exception as e:
            logger.error(f"Error deleting menu item: {e}")
            db.rollback()
            return HTMLResponse(content=f"<div class='alert alert-danger'>Error: {str(e)}</div>")
        finally:
            db.close()
    
    @expose("/reorder", methods=["POST"])
    async def reorder_items(self, request: Request) -> Response:
        """Reorder menu items"""
        db = next(get_db())
        try:
            data = await request.json()
            item_orders = data.get("item_orders", [])
            
            for item_data in item_orders:
                item_id = item_data.get("id")
                new_order = item_data.get("sort_order")
                
                item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
                if item:
                    item.sort_order = new_order
                    item.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {"success": True, "message": "Menu items reordered successfully"}
            
        except Exception as e:
            logger.error(f"Error reordering menu items: {e}")
            db.rollback()
            return {"success": False, "message": str(e)}
        finally:
            db.close()
    
    def _render_template(self, template_name: str, context: dict) -> HTMLResponse:
        """Render HTML template using SQLAdmin layout"""
        if template_name == "menu_items_crud.html":
            template_str = self._get_crud_template()
        elif template_name == "menu_item_form.html":
            template_str = self._get_form_template()
        else:
            template_str = "<div>Template not found</div>"
        
        template = Template(template_str)
        html_content = template.render(**context)
        
        return HTMLResponse(content=html_content)
    
    def _get_crud_template(self) -> str:
        """Get CRUD template HTML"""
        return """
{% extends "admin/base.html" %}
{% block body %}
<div class="content">
    <div class="container-fluid">
    <link href="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.css" rel="stylesheet">
    <style>
        .stats-card {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .item-card {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .item-card:hover {
            transform: translateY(-2px);
        }
        .item-card.dragging {
            opacity: 0.5;
            transform: rotate(5deg);
        }
        .drag-handle {
            cursor: move;
            color: #666;
        }
        .drag-handle:hover {
            color: #333;
        }
        .badge-status {
            font-size: 0.8em;
        }
        .icon-preview {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            object-fit: cover;
        }
        .filter-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .sortable-ghost {
            opacity: 0.4;
        }
        .sortable-drag {
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center my-4">
                    <h1><i class="fas fa-bars"></i> Menu Items CRUD</h1>
                    <div>
                        <a href="/admin/menu-items-crud/create" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Create New Item
                        </a>
                        <a href="/admin/menu-management" class="btn btn-secondary" style="margin-left: 10px;">
                            <i class="fas fa-arrow-left"></i> Back to Menu Management
                        </a>
                    </div>
                </div>
                
                {% if request.query_params.get('message') %}
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    {{ request.query_params.get('message') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                {% endif %}
                
                <!-- Statistics -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="stats-card text-center">
                            <h3 class="text-primary">{{ stats.total_items }}</h3>
                            <p class="mb-0">Total Items</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stats-card text-center">
                            <h3 class="text-success">{{ stats.active_items }}</h3>
                            <p class="mb-0">Active Items</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stats-card text-center">
                            <h3 class="text-warning">{{ stats.premium_items }}</h3>
                            <p class="mb-0">Premium Items</p>
                        </div>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="filter-section">
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label">Filter by Section</label>
                            <select class="form-select" id="sectionFilter" onchange="filterItems()">
                                <option value="">All Sections</option>
                                {% for section in sections %}
                                <option value="{{ section.id }}" {% if section.id == current_section_id %}selected{% endif %}>
                                    {{ section.title }}
                                </option>
                                {% endfor %}
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Search</label>
                            <input type="text" class="form-control" id="searchInput" placeholder="Search items..." value="{{ current_search }}" onkeyup="filterItems()">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-outline-secondary d-block" onclick="clearFilters()">
                                <i class="fas fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Menu Items -->
                <div class="row">
                    <div class="col-12">
                        <div id="itemsList">
                            {% for item in menu_items %}
                            <div class="item-card" data-item-id="{{ item.id }}">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <i class="fas fa-grip-vertical drag-handle"></i>
                                    </div>
                                    <div class="col-auto">
                                        {% if item.icon and item.icon.startswith('/') %}
                                        <img src="{{ item.icon }}" alt="Icon" class="icon-preview">
                                        {% else %}
                                        <div class="icon-preview d-flex align-items-center justify-content-center bg-light">
                                            <span style="font-size: 20px;">{{ item.icon or '📱' }}</span>
                                        </div>
                                        {% endif %}
                                    </div>
                                    <div class="col">
                                        <h5 class="mb-1">{{ item.title }}</h5>
                                        <p class="mb-1 text-muted">{{ item.description }}</p>
                                        <small class="text-muted">
                                            Section: {{ item.section_name }} | 
                                            Action: {{ item.action_type }}:{{ item.action_value }} |
                                            Order: {{ item.sort_order }}
                                        </small>
                                        <div class="mt-2">
                                            {% if item.is_active %}
                                            <span class="badge bg-success badge-status">Active</span>
                                            {% endif %}
                                            {% if item.is_premium %}
                                            <span class="badge bg-warning badge-status">Premium</span>
                                            {% endif %}
                                            {% if item.requires_auth %}
                                            <span class="badge bg-info badge-status">Auth Required</span>
                                            {% endif %}
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="btn-group">
                                            <a href="/admin/menu-items-crud/edit/{{ item.id }}" class="btn btn-sm btn-outline-primary">
                                                <i class="fas fa-edit"></i> Edit
                                            </a>
                                            <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('{{ item.id }}')">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {% endfor %}
                            
                            {% if not menu_items %}
                            <div class="text-center py-5">
                                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                                <h4 class="text-muted">No menu items found</h4>
                                <p class="text-muted">Create your first menu item to get started</p>
                                <a href="/admin/menu-items-crud/create" class="btn btn-primary">
                                    <i class="fas fa-plus"></i> Create Item
                                </a>
                            </div>
                            {% endif %}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete this menu item? This action cannot be undone.
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script>
        // Initialize sortable
        new Sortable(document.getElementById('itemsList'), {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                updateItemOrder();
            }
        });
        
        let deleteItemId = null;
        
        function deleteItem(itemId) {
            deleteItemId = itemId;
            new bootstrap.Modal(document.getElementById('deleteModal')).show();
        }
        
        document.getElementById('confirmDelete').addEventListener('click', function() {
            if (deleteItemId) {
                fetch(`/admin/menu-items-crud/delete/${deleteItemId}`, {
                    method: 'POST'
                })
                .then(response => response.text())
                .then(data => {
                    window.location.href = '/admin/menu-items-crud/manage';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error deleting item');
                });
            }
        });
        
        function filterItems() {
            const sectionId = document.getElementById('sectionFilter').value;
            const search = document.getElementById('searchInput').value;
            
            let url = '/admin/menu-items-crud/manage?';
            if (sectionId) url += `section_id=${sectionId}&`;
            if (search) url += `search=${search}&`;
            
            window.location.href = url;
        }
        
        function clearFilters() {
            window.location.href = '/admin/menu-items-crud/manage';
        }
        
        function updateItemOrder() {
            const items = document.querySelectorAll('.item-card');
            const itemOrders = [];
            
            items.forEach((item, index) => {
                itemOrders.push({
                    id: item.dataset.itemId,
                    sort_order: index
                });
            });
            
            fetch('/admin/menu-items-crud/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ item_orders: itemOrders })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Items reordered successfully');
                } else {
                    console.error('Error reordering items:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    </script>
</div>
</div>
{% endblock %}
{% block extrajs %}
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
{% endblock %}
        """
    
    def _get_form_template(self) -> str:
        """Get form template HTML"""
        return """
{% extends "admin/base.html" %}
{% block body %}
<div class="content">
    <div class="container-fluid">
    <style>
        .form-section {
            background: #fff;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .icon-preview {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
            border: 2px solid #dee2e6;
        }
        .upload-area {
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        .upload-area:hover {
            border-color: #007bff;
            background-color: #f8f9fa;
        }
        .upload-area.dragover {
            border-color: #007bff;
            background-color: #e3f2fd;
        }
        .preview-container {
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center my-4">
                    <h1><i class="fas fa-{{ 'edit' if is_edit else 'plus' }}"></i> {{ "Edit" if is_edit else "Create" }} Menu Item</h1>
                    <a href="/admin/menu-items-crud/manage" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back to Items
                    </a>
                </div>
                
                <form method="POST" action="/admin/menu-items-crud/save" enctype="multipart/form-data">
                    {% if item %}
                    <input type="hidden" name="item_id" value="{{ item.id }}">
                    {% endif %}
                    
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h4 class="mb-4"><i class="fas fa-info-circle"></i> Basic Information</h4>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="mb-3">
                                    <label class="form-label">Title *</label>
                                    <input type="text" class="form-control" name="title" required 
                                           value="{{ item.title if item else '' }}" placeholder="Enter menu item title">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3" 
                                              placeholder="Enter menu item description">{{ item.description if item else '' }}</textarea>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Section</label>
                                            <select class="form-select" name="section_id">
                                                <option value="">No Section</option>
                                                {% for section in sections %}
                                                <option value="{{ section.id }}" {% if item and item.section_id == section.id %}selected{% endif %}>
                                                    {{ section.title }}
                                                </option>
                                                {% endfor %}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Sort Order</label>
                                            <input type="number" class="form-control" name="sort_order" 
                                                   value="{{ item.sort_order if item else 0 }}" min="0">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Icon/Emoji</label>
                                    <input type="text" class="form-control" name="icon" 
                                           value="{{ item.icon if item else '' }}" placeholder="📱 or icon path">
                                    {% if item and item.icon and item.icon.startswith('/') %}
                                    <div class="preview-container">
                                        <img src="{{ item.icon }}" alt="Current Icon" class="icon-preview">
                                    </div>
                                    {% endif %}
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Upload Icon Image</label>
                                    <div class="upload-area" onclick="document.getElementById('iconFile').click()">
                                        <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                                        <p class="mb-0">Click to upload or drag and drop</p>
                                        <small class="text-muted">PNG, JPG, GIF, WebP (Max 5MB)</small>
                                    </div>
                                    <input type="file" id="iconFile" name="icon_file" accept="image/*" style="display: none;" onchange="previewImage(this)">
                                    <div id="imagePreview" class="preview-container"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Configuration -->
                    <div class="form-section">
                        <h4 class="mb-4"><i class="fas fa-cog"></i> Action Configuration</h4>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Action Type *</label>
                                    <select class="form-select" name="action_type" required onchange="updateActionValuePlaceholder()">
                                        <option value="">Select action type</option>
                                        <option value="screen" {% if item and item.action_type == 'screen' %}selected{% endif %}>Screen</option>
                                        <option value="url" {% if item and item.action_type == 'url' %}selected{% endif %}>URL</option>
                                        <option value="action" {% if item and item.action_type == 'action' %}selected{% endif %}>Action</option>
                                        <option value="section" {% if item and item.action_type == 'section' %}selected{% endif %}>Section</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Action Value *</label>
                                    <input type="text" class="form-control" name="action_value" required 
                                           value="{{ item.action_value if item else '' }}" 
                                           placeholder="e.g., HomeScreen, https://example.com, open_settings"
                                           id="actionValue">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings -->
                    <div class="form-section">
                        <h4 class="mb-4"><i class="fas fa-sliders-h"></i> Settings</h4>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" name="is_active" 
                                           {% if item and item.is_active %}checked{% endif %} {% if not item %}checked{% endif %}>
                                    <label class="form-check-label">Active</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" name="is_premium" 
                                           {% if item and item.is_premium %}checked{% endif %}>
                                    <label class="form-check-label">Premium Feature</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" name="requires_auth" 
                                           {% if item and item.requires_auth %}checked{% endif %}>
                                    <label class="form-check-label">Requires Authentication</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Meta Data -->
                    <div class="form-section">
                        <h4 class="mb-4"><i class="fas fa-code"></i> Meta Data (Optional)</h4>
                        <div class="mb-3">
                            <label class="form-label">JSON Configuration</label>
                            <textarea class="form-control" name="meta_data" rows="5" 
                                      placeholder='{"key": "value"}'>{{ item.meta_data|tojson if item else '' }}</textarea>
                            <small class="form-text text-muted">Additional configuration in JSON format</small>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="text-center">
                        <button type="submit" class="btn btn-primary btn-lg">
                            <i class="fas fa-save"></i> {{ "Update" if is_edit else "Create" }} Menu Item
                        </button>
                        <a href="/admin/menu-items-crud/manage" class="btn btn-secondary btn-lg ms-2">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function updateActionValuePlaceholder() {
            const actionType = document.querySelector('select[name="action_type"]').value;
            const actionValue = document.getElementById('actionValue');
            
            const placeholders = {
                'screen': 'e.g., HomeScreen, ProfileScreen',
                'url': 'e.g., https://example.com',
                'action': 'e.g., open_settings, refresh_data',
                'section': 'e.g., main_menu, settings_menu'
            };
            
            actionValue.placeholder = placeholders[actionType] || 'Enter action value';
        }
        
        function previewImage(input) {
            const preview = document.getElementById('imagePreview');
            
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    preview.innerHTML = `
                        <div class="position-relative">
                            <img src="${e.target.result}" alt="Preview" class="icon-preview">
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" 
                                    onclick="removeImage()" style="transform: translate(50%, -50%);">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                };
                
                reader.readAsDataURL(input.files[0]);
            }
        }
        
        function removeImage() {
            document.getElementById('iconFile').value = '';
            document.getElementById('imagePreview').innerHTML = '';
        }
        
        // Drag and drop functionality
        const uploadArea = document.querySelector('.upload-area');
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('iconFile').files = files;
                previewImage(document.getElementById('iconFile'));
            }
        });
        
        // Initialize action value placeholder
        updateActionValuePlaceholder();
    </script>
</div>
</div>
{% endblock %}
{% block extrajs %}
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
{% endblock %}
        """