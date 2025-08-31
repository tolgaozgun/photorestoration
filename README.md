# Photo Restoration App

AI-powered photo enhancement mobile app using Google's Nano Banana model.

## Features
- 📸 Camera and gallery photo selection
- ✨ AI-powered photo restoration
- 🎯 Standard and HD resolution options
- 💳 In-app purchases for credits and subscriptions
- 📊 Built-in analytics tracking
- 🔒 Privacy-first with UUID-based tracking

## Project Structure
```
photorestoration/
├── backend/          # FastAPI backend
├── src/             # React Native Expo app
├── docs/            # Documentation
└── Dockerfile       # Single deployment file
```

## Development Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd src
npm install
npx expo start
```

## Environment Variables

### Backend
- `DATABASE_URL`: Database connection string
- `MINIO_ENDPOINT`: MinIO server endpoint
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key
- `MINIO_BUCKET`: S3 bucket name
- `GOOGLE_API_KEY`: Google Gemini API key for image enhancement

### Frontend
- `EXPO_PUBLIC_API_URL`: Backend API URL

## Deployment
Single Dockerfile deployment via GitHub webhook to Coolify.

```bash
docker build -t photo-restoration .
docker run -p 8000:8000 photo-restoration
```

## Pricing Tiers

### One-Time Credits
- Standard: 25 ($1), 70 ($2.50), 150 ($5)
- HD: 10 ($1), 30 ($2.50), 70 ($5)

### Subscriptions
- Light: $4.99/mo (15 standard + 5 HD daily)
- Standard: $9.99/mo (30 standard + 10 HD daily)
- Premium: $19.99/mo (60 standard + 25 HD daily)

## Tech Stack
- Frontend: React Native (Expo)
- Backend: FastAPI (Python)
- Storage: MinIO
- Database: PostgreSQL/SQLite
- Payments: Apple/Google IAP