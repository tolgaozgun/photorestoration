# Photo Restoration Backend - Restructured

## Overview

This backend application has been restructured from a monolithic `main.py` file into a well-organized modular architecture.

## New Structure

```
backend/
├── app/
│   ├── __init__.py                 # App package initialization
│   ├── main.py                     # FastAPI application factory and configuration
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py             # Application configuration and settings
│   ├── models/
│   │   ├── __init__.py
│   │   └── database.py             # SQLAlchemy models and database setup
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── requests.py             # Pydantic request models
│   │   └── responses.py            # Pydantic response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py         # User management logic
│   │   ├── storage_service.py      # MinIO/S3 storage operations
│   │   ├── enhancement_service.py  # Image enhancement logic
│   │   └── analytics_service.py    # Analytics and history logic
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── enhancement.py          # Image enhancement endpoints
│   │   ├── purchase.py              # Purchase and credit endpoints
│   │   ├── analytics.py            # Analytics and health endpoints
│   │   └── user.py                 # User management and device linking endpoints
│   ├── admin/
│   │   ├── __init__.py
│   │   └── admin_setup.py          # SQLAdmin configuration
│   └── utils/                      # Utility functions (if needed)
├── main.py                         # Application entry point
├── main.py.backup                  # Original monolithic file (backup)
├── image_enhancement.py            # Core image enhancement service
├── email_service.py                # Email service implementation
├── requirements.txt                # Python dependencies
└── test_structure.py              # Structure validation script
```

## Key Improvements

1. **Modular Architecture**: Each component has a clear responsibility
2. **Separation of Concerns**: Business logic, data models, and API routes are separated
3. **Configuration Management**: Centralized configuration with environment variable support
4. **Service Layer**: Reusable business logic services
5. **Type Safety**: Full Pydantic schema validation
6. **Maintainability**: Easier to test, modify, and extend

## Running the Application

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing the Structure

Run the test script to verify all imports work correctly:

```bash
python test_structure.py
```

## API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/docs
- Admin Panel: http://localhost:8000/admin

## Environment Variables

The application uses the same environment variables as before, now managed through the configuration system:

- `DATABASE_URL` or individual `DB_*` variables
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- `GOOGLE_API_KEY`
- Email service configuration
- And more...

## Migration Guide

The restructured application maintains full API compatibility with the original monolithic version. No changes are required in the mobile app or other clients.