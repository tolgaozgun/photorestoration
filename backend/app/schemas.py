from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class MenuSectionBase(BaseModel):
    name: str
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    layout: str = "grid"
    sort_order: int = 0
    is_active: bool = True
    metadata: Dict[str, Any] = {}

class MenuSection(MenuSectionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    action_type: str
    action_value: Optional[str] = None
    parent_id: Optional[str] = None
    section_id: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    is_premium: bool = False
    requires_auth: bool = False
    metadata: Dict[str, Any] = {}

class MenuItem(MenuItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True