from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from ..models import MenuVersion, MenuDeployment, MenuSection, MenuItem
import json
import uuid

class MenuConfigurationService:
    @staticmethod
    def create_menu_version(
        db: Session, 
        version: str, 
        environment: str, 
        menu_config: Dict,
        changelog: Optional[str] = None,
        created_by: Optional[str] = None,
        is_development: bool = False
    ) -> MenuVersion:
        """Create a new menu version"""
        
        # Deactivate other active versions for this environment
        if environment != "development":
            db.query(MenuVersion).filter(
                and_(
                    MenuVersion.environment == environment,
                    MenuVersion.is_active == True
                )
            ).update({"is_active": False})
        
        # Create new version
        menu_version = MenuVersion(
            id=str(uuid.uuid4()),
            version=version,
            environment=environment,
            menu_config=menu_config,
            changelog=changelog,
            is_active=True,  # New versions are active by default
            is_development=is_development,
            created_by=created_by
        )
        
        db.add(menu_version)
        db.commit()
        db.refresh(menu_version)
        
        return menu_version
    
    @staticmethod
    def get_current_menu_config(db: Session, environment: str = "production") -> Optional[Dict]:
        """Get the current active menu configuration for an environment"""
        
        version = db.query(MenuVersion).filter(
            and_(
                MenuVersion.environment == environment,
                MenuVersion.is_active == True
            )
        ).order_by(desc(MenuVersion.created_at)).first()
        
        if version:
            return {
                "version": version.version,
                "config": version.menu_config,
                "created_at": version.created_at.isoformat(),
                "changelog": version.changelog
            }
        
        return None
    
    @staticmethod
    def get_development_menu_config(db: Session) -> Optional[Dict]:
        """Get the development menu configuration (real-time)"""
        
        version = db.query(MenuVersion).filter(
            MenuVersion.is_development == True
        ).order_by(desc(MenuVersion.created_at)).first()
        
        if version:
            return {
                "version": version.version,
                "config": version.menu_config,
                "created_at": version.created_at.isoformat(),
                "changelog": version.changelog
            }
        
        return None
    
    @staticmethod
    def generate_menu_config_from_db(db: Session) -> Dict:
        """Generate menu configuration from current database state"""
        
        # Get all active sections
        sections = db.query(MenuSection).filter(
            MenuSection.is_active == True
        ).order_by(MenuSection.sort_order).all()
        
        # Get all active items
        items = db.query(MenuItem).filter(
            MenuItem.is_active == True
        ).order_by(MenuItem.sort_order).all()
        
        # Build configuration
        config = {
            "sections": [],
            "items": [],
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "total_sections": len(sections),
                "total_items": len(items)
            }
        }
        
        # Add sections
        for section in sections:
            config["sections"].append({
                "id": section.id,
                "name": section.name,
                "title": section.title,
                "description": section.description,
                "icon": section.icon,
                "layout": section.layout,
                "sort_order": section.sort_order,
                "meta_data": section.meta_data
            })
        
        # Add items
        for item in items:
            config["items"].append({
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "icon": item.icon,
                "action_type": item.action_type,
                "action_value": item.action_value,
                "parent_id": item.parent_id,
                "section_id": item.section_id,
                "sort_order": item.sort_order,
                "is_premium": item.is_premium,
                "requires_auth": item.requires_auth,
                "meta_data": item.meta_data
            })
        
        return config
    
    @staticmethod
    def create_version_from_current_state(
        db: Session,
        environment: str = "production",
        version_increment: str = "patch",
        changelog: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> MenuVersion:
        """Create a new version from current database state"""
        
        # Get current version to determine next version
        current_version = db.query(MenuVersion).filter(
            MenuVersion.environment == environment
        ).order_by(desc(MenuVersion.created_at)).first()
        
        if current_version:
            base_version = current_version.version
        else:
            base_version = "1.0.0"
        
        # Increment version
        if version_increment == "major":
            parts = base_version.split('.')
            new_version = f"{int(parts[0]) + 1}.0.0"
        elif version_increment == "minor":
            parts = base_version.split('.')
            new_version = f"{parts[0]}.{int(parts[1]) + 1}.0"
        else:  # patch
            parts = base_version.split('.')
            new_version = f"{parts[0]}.{parts[1]}.{int(parts[2]) + 1}"
        
        # Generate menu config
        menu_config = MenuConfigurationService.generate_menu_config_from_db(db)
        
        # Create new version
        return MenuConfigurationService.create_menu_version(
            db=db,
            version=new_version,
            environment=environment,
            menu_config=menu_config,
            changelog=changelog or f"Automatic version {new_version}",
            created_by=created_by
        )
    
    @staticmethod
    def deploy_version(
        db: Session,
        version_id: str,
        environment: str,
        deployed_by: Optional[str] = None
    ) -> MenuDeployment:
        """Deploy a specific version to an environment"""
        
        # Get the version
        version = db.query(MenuVersion).filter(MenuVersion.id == version_id).first()
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        # Deactivate current active version for this environment
        db.query(MenuVersion).filter(
            and_(
                MenuVersion.environment == environment,
                MenuVersion.is_active == True
            )
        ).update({"is_active": False})
        
        # Activate the deployed version
        version.is_active = True
        version.deployed_at = datetime.utcnow()
        
        # Create deployment record
        deployment = MenuDeployment(
            id=str(uuid.uuid4()),
            version_id=version_id,
            environment=environment,
            deployed_by=deployed_by,
            status="success"
        )
        
        db.add(deployment)
        db.commit()
        db.refresh(deployment)
        
        return deployment
    
    @staticmethod
    def get_version_history(db: Session, environment: Optional[str] = None) -> List[Dict]:
        """Get version history"""
        
        query = db.query(MenuVersion)
        if environment:
            query = query.filter(MenuVersion.environment == environment)
        
        versions = query.order_by(desc(MenuVersion.created_at)).all()
        
        return [
            {
                "id": v.id,
                "version": v.version,
                "environment": v.environment,
                "changelog": v.changelog,
                "is_active": v.is_active,
                "is_development": v.is_development,
                "created_at": v.created_at.isoformat(),
                "deployed_at": v.deployed_at.isoformat() if v.deployed_at else None,
                "created_by": v.created_by
            }
            for v in versions
        ]
    
    @staticmethod
    def get_deployment_history(db: Session, environment: Optional[str] = None) -> List[Dict]:
        """Get deployment history"""
        
        query = db.query(MenuDeployment)
        if environment:
            query = query.filter(MenuDeployment.environment == environment)
        
        deployments = query.order_by(desc(MenuDeployment.deployed_at)).all()
        
        return [
            {
                "id": d.id,
                "version_id": d.version_id,
                "environment": d.environment,
                "status": d.status,
                "deployed_at": d.deployed_at.isoformat(),
                "deployed_by": d.deployed_by
            }
            for d in deployments
        ]
    
    @staticmethod
    def set_development_version(
        db: Session,
        version_id: str,
        set_by: Optional[str] = None
    ) -> MenuVersion:
        """Set a version as the current development version"""
        
        # Clear existing development version
        db.query(MenuVersion).filter(
            MenuVersion.is_development == True
        ).update({"is_development": False})
        
        # Set new development version
        version = db.query(MenuVersion).filter(MenuVersion.id == version_id).first()
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        version.is_development = True
        db.commit()
        db.refresh(version)
        
        return version