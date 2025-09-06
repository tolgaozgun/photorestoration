from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import sys
import logging
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Import from backend root directory
sys.path.append('/app')
from email_service import EmailService

from .models import engine
from .config import settings
from .routes import enhancement_router, purchase_router, analytics_router, user_router
from .services import StorageService, EnhancementService
from .admin import setup_admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        forwarded_proto = request.headers.get("x-forwarded-proto")
        forwarded_host = request.headers.get("x-forwarded-host") 
        host = request.headers.get("host")
        
        if forwarded_proto == "https" or (host and "pointtwostudios.com" in host):
            if request.url.path.startswith("/admin"):
                request.scope["scheme"] = "https"
                if forwarded_host:
                    request.scope["server"] = (forwarded_host, 443)
        
        response = await call_next(request)
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    
    storage_service = StorageService()
    storage_service.initialize()
    
    enhancement_service = EnhancementService()
    
    email_service = None
    try:
        email_service = EmailService()
        logger.info("Email service initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize email service: {e}")
    
    app.state.storage_service = storage_service
    app.state.enhancement_service = enhancement_service
    app.state.email_service = email_service
    
    yield
    
    logger.info("Shutting down application...")

def setup_static_files(app):
    sqladmin_static_paths = [
        "/usr/local/lib/python3.11/site-packages/sqladmin/statics",
        "/usr/local/lib/python3.11/site-packages/sqladmin/static",
        "/opt/venv/lib/python3.11/site-packages/sqladmin/statics",
        "/app/.venv/lib/python3.11/site-packages/sqladmin/statics",
    ]
    
    for static_path in sqladmin_static_paths:
        if os.path.exists(static_path):
            try:
                app.mount("/admin/statics", StaticFiles(directory=static_path), name="sqladmin_statics")
                app.mount("/admin/static", StaticFiles(directory=static_path), name="sqladmin_static")
                logger.info(f"Mounted static files from {static_path}")
                break
            except Exception as e:
                logger.warning(f"Failed to mount static files from {static_path}: {e}")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan
    )
    
    setup_admin(app, engine)
    setup_static_files(app)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_middleware(HTTPSRedirectMiddleware)
    
    app.include_router(enhancement_router, prefix="/api")
    app.include_router(purchase_router, prefix="/api")
    app.include_router(analytics_router, prefix="/api")
    app.include_router(user_router, prefix="/api")
    
    @app.get("/debug/admin-static")
    def debug_admin_static():
        import sqladmin
        
        debug_info = {
            "sqladmin_version": getattr(sqladmin, '__version__', 'Unknown'),
            "sqladmin_location": sqladmin.__file__,
            "sqladmin_directory": os.path.dirname(sqladmin.__file__),
            "current_working_directory": os.getcwd(),
            "routes": [],
            "static_paths_checked": []
        }
        
        for route in app.routes:
            if hasattr(route, 'path'):
                route_info = {
                    "path": route.path,
                    "methods": list(route.methods) if hasattr(route, 'methods') else ["MOUNT"],
                    "name": getattr(route, 'name', 'unnamed')
                }
                debug_info["routes"].append(route_info)
        
        sqladmin_dir = os.path.dirname(sqladmin.__file__)
        potential_paths = [
            os.path.join(sqladmin_dir, 'statics'),
            os.path.join(sqladmin_dir, 'static'),
            os.path.join(sqladmin_dir, 'assets'),
            '/usr/local/lib/python3.11/site-packages/sqladmin/statics',
            '/usr/local/lib/python3.11/site-packages/sqladmin/static',
        ]
        
        for path in potential_paths:
            path_info = {
                "path": path,
                "exists": os.path.exists(path),
                "contents": []
            }
            
            if os.path.exists(path):
                try:
                    path_info["contents"] = os.listdir(path)
                    css_files = [f for f in path_info["contents"] if f.endswith('.css')]
                    if css_files:
                        path_info["css_files"] = css_files
                except Exception as e:
                    path_info["error"] = str(e)
            
            debug_info["static_paths_checked"].append(path_info)
        
        return debug_info
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)