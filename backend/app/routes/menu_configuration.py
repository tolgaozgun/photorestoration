from fastapi import APIRouter, Depends, Query, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import Dict, Optional, List
from ..models import get_db
from ..services import MenuConfigurationService
from ..schemas.requests import MenuVersionRequest, MenuDeployRequest, MenuDevelopmentRequest
from ..schemas.responses import (
    MenuConfigurationResponse, 
    MenuVersionResponse, 
    MenuDeploymentResponse
)

router = APIRouter()

@router.get("/menu/config", response_model=MenuConfigurationResponse)
async def get_menu_config(
    request: Request,
    environment: str = Query("production", description="Environment (production, development)"),
    development_mode: bool = Query(False, description="Force development mode"),
    db: Session = Depends(get_db)
):
    """Get menu configuration for a specific environment"""
    try:
        if development_mode:
            # In development mode, get the development version
            config = MenuConfigurationService.get_development_menu_config(db)
            if not config:
                # Fallback to production if no development version
                config = MenuConfigurationService.get_current_menu_config(db, "production")
                if not config:
                    # Generate from current database state as last resort
                    menu_config = MenuConfigurationService.generate_menu_config_from_db(db)
                    config = {
                        "version": "development-latest",
                        "config": menu_config,
                        "created_at": "2024-01-01T00:00:00",
                        "changelog": "Development mode - generated from database"
                    }
        else:
            config = MenuConfigurationService.get_current_menu_config(db, environment)
            if not config:
                # If no version exists, generate from current database state
                menu_config = MenuConfigurationService.generate_menu_config_from_db(db)
                config = {
                    "version": "1.0.0",
                    "config": menu_config,
                    "created_at": "2024-01-01T00:00:00",
                    "changelog": "Initial version - generated from database"
                }
        
        # Track analytics for menu config access
        try:
            from ..services.analytics_service import AnalyticsService
            analytics_service = AnalyticsService()
            analytics_service.track_event(
                db=db,
                user_id=request.headers.get("user-id") or "anonymous",
                event_type="menu_config_access",
                event_data={
                    "environment": environment,
                    "development_mode": development_mode,
                    "version": config["version"],
                    "user_agent": request.headers.get("user-agent"),
                    "client_ip": request.client.host if request.client else None,
                    "session_id": request.headers.get("session-id"),
                    "from_cache": False  # Will be updated if cached
                },
                platform="mobile",
                app_version=request.headers.get("app-version", "unknown")
            )
        except Exception as analytics_error:
            # Don't fail the request if analytics fails
            print(f"Analytics tracking failed: {analytics_error}")
        
        return MenuConfigurationResponse(**config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching menu configuration: {str(e)}")

@router.post("/menu/versions", response_model=MenuVersionResponse)
async def create_menu_version(
    request: MenuVersionRequest,
    db: Session = Depends(get_db)
):
    """Create a new menu version"""
    try:
        # Generate menu config from current database state
        menu_config = MenuConfigurationService.generate_menu_config_from_db(db)
        
        version = MenuConfigurationService.create_menu_version(
            db=db,
            version=request.version,
            environment=request.environment,
            menu_config=menu_config,
            changelog=request.changelog,
            is_development=request.is_development
        )
        
        # Track analytics for version creation
        try:
            from ..services.analytics_service import AnalyticsService
            analytics_service = AnalyticsService()
            analytics_service.track_event(
                db=db,
                user_id=request.created_by or "admin",
                event_type="menu_version_created",
                event_data={
                    "version": request.version,
                    "environment": request.environment,
                    "is_development": request.is_development,
                    "changelog": request.changelog,
                    "menu_sections_count": len(menu_config.get("sections", [])),
                    "menu_items_count": len(menu_config.get("items", []))
                },
                platform="admin",
                app_version="unknown"
            )
        except Exception as analytics_error:
            print(f"Analytics tracking failed: {analytics_error}")
        
        return MenuVersionResponse(
            id=version.id,
            version=version.version,
            environment=version.environment,
            changelog=version.changelog,
            is_active=version.is_active,
            is_development=version.is_development,
            created_at=version.created_at.isoformat(),
            deployed_at=version.deployed_at.isoformat() if version.deployed_at else None,
            created_by=version.created_by
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating menu version: {str(e)}")

@router.get("/menu/versions", response_model=List[MenuVersionResponse])
async def get_menu_versions(
    environment: Optional[str] = Query(None, description="Filter by environment"),
    db: Session = Depends(get_db)
):
    """Get all menu versions"""
    try:
        versions = MenuConfigurationService.get_version_history(db, environment)
        return [MenuVersionResponse(**v) for v in versions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching menu versions: {str(e)}")

@router.post("/menu/deploy", response_model=MenuDeploymentResponse)
async def deploy_menu_version(
    request: MenuDeployRequest,
    db: Session = Depends(get_db)
):
    """Deploy a menu version to an environment"""
    try:
        deployment = MenuConfigurationService.deploy_version(
            db=db,
            version_id=request.version_id,
            environment=request.environment
        )
        
        # Track analytics for deployment
        try:
            from ..services.analytics_service import AnalyticsService
            analytics_service = AnalyticsService()
            analytics_service.track_event(
                db=db,
                user_id=request.deployed_by or "admin",
                event_type="menu_version_deployed",
                event_data={
                    "version_id": request.version_id,
                    "environment": request.environment,
                    "deployment_id": deployment.id,
                    "deployment_status": deployment.status,
                    "deployed_at": deployment.deployed_at.isoformat()
                },
                platform="admin",
                app_version="unknown"
            )
        except Exception as analytics_error:
            print(f"Analytics tracking failed: {analytics_error}")
        
        return MenuDeploymentResponse(
            id=deployment.id,
            version_id=deployment.version_id,
            environment=deployment.environment,
            status=deployment.status,
            deployed_at=deployment.deployed_at.isoformat(),
            deployed_by=deployment.deployed_by
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deploying menu version: {str(e)}")

@router.get("/menu/deployments", response_model=List[MenuDeploymentResponse])
async def get_menu_deployments(
    environment: Optional[str] = Query(None, description="Filter by environment"),
    db: Session = Depends(get_db)
):
    """Get deployment history"""
    try:
        deployments = MenuConfigurationService.get_deployment_history(db, environment)
        return [MenuDeploymentResponse(**d) for d in deployments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deployment history: {str(e)}")

@router.post("/menu/development/set", response_model=MenuVersionResponse)
async def set_development_version(
    request: MenuDevelopmentRequest,
    db: Session = Depends(get_db)
):
    """Set a version as the current development version"""
    try:
        version = MenuConfigurationService.set_development_version(
            db=db,
            version_id=request.version_id
        )
        
        return MenuVersionResponse(
            id=version.id,
            version=version.version,
            environment=version.environment,
            changelog=version.changelog,
            is_active=version.is_active,
            is_development=version.is_development,
            created_at=version.created_at.isoformat(),
            deployed_at=version.deployed_at.isoformat() if version.deployed_at else None,
            created_by=version.created_by
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting development version: {str(e)}")

@router.post("/menu/versions/auto-create", response_model=MenuVersionResponse)
async def auto_create_version(
    environment: str = Body("production", description="Target environment"),
    version_increment: str = Body("patch", description="Version increment type (major, minor, patch)"),
    changelog: Optional[str] = Body(None, description="Changelog for the version"),
    db: Session = Depends(get_db)
):
    """Automatically create a new version from current database state"""
    try:
        version = MenuConfigurationService.create_version_from_current_state(
            db=db,
            environment=environment,
            version_increment=version_increment,
            changelog=changelog
        )
        
        return MenuVersionResponse(
            id=version.id,
            version=version.version,
            environment=version.environment,
            changelog=version.changelog,
            is_active=version.is_active,
            is_development=version.is_development,
            created_at=version.created_at.isoformat(),
            deployed_at=version.deployed_at.isoformat() if version.deployed_at else None,
            created_by=version.created_by
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error auto-creating version: {str(e)}")

@router.get("/menu/config/check-version")
async def check_menu_version(
    request: Request,
    current_version: str = Query(..., description="Current version on client"),
    environment: str = Query("production", description="Environment to check against"),
    db: Session = Depends(get_db)
):
    """Check if there's a newer version available"""
    try:
        config = MenuConfigurationService.get_current_menu_config(db, environment)
        if not config:
            return {"has_update": False, "current_version": current_version}
        
        # Simple version comparison (can be enhanced)
        has_update = config["version"] != current_version
        
        # Track analytics for version check
        try:
            from ..services.analytics_service import AnalyticsService
            analytics_service = AnalyticsService()
            analytics_service.track_event(
                db=db,
                user_id=request.headers.get("user-id") or "anonymous",
                event_type="menu_version_check",
                event_data={
                    "current_version": current_version,
                    "environment": environment,
                    "has_update": has_update,
                    "latest_version": config["version"],
                    "user_agent": request.headers.get("user-agent"),
                    "client_ip": request.client.host if request.client else None
                },
                platform="mobile",
                app_version=request.headers.get("app-version", "unknown")
            )
        except Exception as analytics_error:
            print(f"Analytics tracking failed: {analytics_error}")
        
        return {
            "has_update": has_update,
            "current_version": current_version,
            "latest_version": config["version"],
            "changelog": config.get("changelog")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking version: {str(e)}")