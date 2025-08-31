# Photo Restoration App Architecture

## Overview
This is a mobile-first photo restoration app using Google's Nano Banana model, built with React Native (Expo) frontend and FastAPI backend.

## Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: Python (FastAPI)
- **Database**: PostgreSQL/SQLite
- **Storage**: MinIO (S3-compatible)
- **Payments**: Apple StoreKit, Google Play Billing
- **Analytics**: Custom backend tracking

## Architecture

### Frontend (React Native)
```
src/
├── App.tsx                 # Main app entry with navigation
├── screens/               # App screens
│   ├── HomeScreen.tsx     # Main screen with upload/camera
│   ├── RestorationPreviewScreen.tsx  # Preview & enhancement
│   └── ExportScreen.tsx   # Save/share enhanced images
├── contexts/              # React contexts
│   ├── UserContext.tsx    # User state management
│   └── AnalyticsContext.tsx  # Analytics tracking
├── utils/                 # Utilities
│   ├── uuid.ts           # UUID generation
│   └── iap.ts            # In-app purchase handling
└── config/               # Configuration
    └── api.ts            # API endpoints config
```

### Backend (FastAPI)
```
backend/
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
└── models/              # SQLAlchemy models
```

## API Endpoints
- `POST /api/enhance` - Process image enhancement
- `POST /api/purchase` - Record purchases
- `POST /api/restore` - Restore purchases
- `POST /api/analytics` - Track events
- `GET /api/image/{key}` - Retrieve processed images

## Data Flow
1. User selects/takes photo
2. App sends image to `/api/enhance` with resolution
3. Backend processes with Nano Banana model
4. Enhanced image stored in MinIO
5. App displays before/after comparison
6. User can save/share enhanced image

## Security
- UUID-based user tracking (no authentication)
- Secure storage for device UUID
- Receipt validation for purchases
- CORS enabled for web testing

## Deployment
- Single Dockerfile (no docker-compose)
- GitHub webhook triggers Coolify deployment
- Environment variables for configuration