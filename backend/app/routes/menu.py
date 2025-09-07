from fastapi import APIRouter, Depends, HTTPException, Header, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from ..models import get_db, MenuItem, MenuSection
from ..schemas import MenuSection as MenuSectionSchema, MenuItem as MenuItemSchema

router = APIRouter()

# Pydantic models for requests/responses
class MenuSectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=10)
    layout: str = Field(default="grid", regex="^(grid|list|horizontal)$")
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    meta_data: Dict[str, Any] = Field(default_factory=dict)

class MenuSectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=10)
    layout: Optional[str] = Field(None, regex="^(grid|list|horizontal)$")
    sort_order: Optional[int] = Field(None)
    is_active: Optional[bool] = Field(None)
    meta_data: Optional[Dict[str, Any]] = Field(None)

class MenuItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=10)
    action_type: str = Field(..., regex="^(screen|url|action|section)$")
    action_value: Optional[str] = Field(None)
    parent_id: Optional[str] = Field(None)
    section_id: Optional[str] = Field(None)
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    is_premium: bool = Field(default=False)
    requires_auth: bool = Field(default=False)
    meta_data: Dict[str, Any] = Field(default_factory=dict)

class MenuItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=10)
    action_type: Optional[str] = Field(None, regex="^(screen|url|action|section)$")
    action_value: Optional[str] = Field(None)
    parent_id: Optional[str] = Field(None)
    section_id: Optional[str] = Field(None)
    sort_order: Optional[int] = Field(None)
    is_active: Optional[bool] = Field(None)
    is_premium: Optional[bool] = Field(None)
    requires_auth: Optional[bool] = Field(None)
    meta_data: Optional[Dict[str, Any]] = Field(None)

class MenuResponse(BaseModel):
    sections: List[MenuSectionSchema]
    items: List[MenuItemSchema]
    success: bool = True

# Menu Sections Endpoints
@router.post("/menu/sections", response_model=MenuSectionSchema)
async def create_menu_section(
    section: MenuSectionCreate,
    db: Session = Depends(get_db)
):
    """Create a new menu section"""
    db_section = MenuSection(
        id=str(uuid.uuid4()),
        **section.dict()
    )
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

@router.get("/menu/sections", response_model=List[MenuSectionSchema])
async def get_menu_sections(
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Get all menu sections"""
    query = db.query(MenuSection)
    if active_only:
        query = query.filter(MenuSection.is_active == True)
    
    return query.order_by(MenuSection.sort_order, MenuSection.created_at).all()

@router.get("/menu/sections/{section_id}", response_model=MenuSectionSchema)
async def get_menu_section(
    section_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific menu section"""
    section = db.query(MenuSection).filter(MenuSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Menu section not found")
    return section

@router.put("/menu/sections/{section_id}", response_model=MenuSectionSchema)
async def update_menu_section(
    section_id: str,
    section_update: MenuSectionUpdate,
    db: Session = Depends(get_db)
):
    """Update a menu section"""
    section = db.query(MenuSection).filter(MenuSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Menu section not found")
    
    update_data = section_update.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(section, field, value)
    
    db.commit()
    db.refresh(section)
    return section

@router.delete("/menu/sections/{section_id}")
async def delete_menu_section(
    section_id: str,
    db: Session = Depends(get_db)
):
    """Delete a menu section"""
    section = db.query(MenuSection).filter(MenuSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Menu section not found")
    
    # Also delete associated menu items
    db.query(MenuItem).filter(MenuItem.section_id == section_id).delete()
    
    db.delete(section)
    db.commit()
    return {"message": "Menu section deleted successfully"}

# Menu Items Endpoints
@router.post("/menu/items", response_model=MenuItemSchema)
async def create_menu_item(
    item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    """Create a new menu item"""
    db_item = MenuItem(
        id=str(uuid.uuid4()),
        **item.dict()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/menu/items", response_model=List[MenuItemSchema])
async def get_menu_items(
    section_id: Optional[str] = Query(None),
    parent_id: Optional[str] = Query(None),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Get menu items with optional filtering"""
    query = db.query(MenuItem)
    
    if section_id:
        query = query.filter(MenuItem.section_id == section_id)
    if parent_id:
        query = query.filter(MenuItem.parent_id == parent_id)
    if active_only:
        query = query.filter(MenuItem.is_active == True)
    
    return query.order_by(MenuItem.sort_order, MenuItem.created_at).all()

@router.get("/menu/items/{item_id}", response_model=MenuItemSchema)
async def get_menu_item(
    item_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@router.put("/menu/items/{item_id}", response_model=MenuItemSchema)
async def update_menu_item(
    item_id: str,
    item_update: MenuItemUpdate,
    db: Session = Depends(get_db)
):
    """Update a menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return item

@router.delete("/menu/items/{item_id}")
async def delete_menu_item(
    item_id: str,
    db: Session = Depends(get_db)
):
    """Delete a menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Also delete child items
    db.query(MenuItem).filter(MenuItem.parent_id == item_id).delete()
    
    db.delete(item)
    db.commit()
    return {"message": "Menu item deleted successfully"}

# Complete Menu Endpoint for Mobile App
@router.get("/menu", response_model=MenuResponse)
async def get_complete_menu(
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Get complete menu structure for mobile app"""
    # Get sections
    sections_query = db.query(MenuSection)
    if active_only:
        sections_query = sections_query.filter(MenuSection.is_active == True)
    
    sections = sections_query.order_by(MenuSection.sort_order, MenuSection.created_at).all()
    
    # Get items
    items_query = db.query(MenuItem)
    if active_only:
        items_query = items_query.filter(MenuItem.is_active == True)
    
    items = items_query.order_by(MenuItem.sort_order, MenuItem.created_at).all()
    
    return {
        "sections": sections,
        "items": items,
        "success": True
    }

# Menu Reordering Endpoints
@router.post("/menu/sections/reorder")
async def reorder_menu_sections(
    section_orders: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db)
):
    """Reorder menu sections"""
    for order in section_orders:
        section_id = order.get("section_id")
        sort_order = order.get("sort_order")
        
        if section_id is not None and sort_order is not None:
            db.query(MenuSection).filter(
                MenuSection.id == section_id
            ).update({"sort_order": sort_order})
    
    db.commit()
    return {"message": "Menu sections reordered successfully"}

@router.post("/menu/items/reorder")
async def reorder_menu_items(
    item_orders: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db)
):
    """Reorder menu items"""
    for order in item_orders:
        item_id = order.get("item_id")
        sort_order = order.get("sort_order")
        
        if item_id is not None and sort_order is not None:
            db.query(MenuItem).filter(
                MenuItem.id == item_id
            ).update({"sort_order": sort_order})
    
    db.commit()
    return {"message": "Menu items reordered successfully"}