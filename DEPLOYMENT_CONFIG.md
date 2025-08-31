# Deployment Configuration

## For Coolify Deployment

Add these environment variables in Coolify's environment variables section:

```
MINIO_ENDPOINT=minio-gwowwcogkgk4wooogwk4ss4k.91.98.16.194.sslip.io
MINIO_ACCESS_KEY=EbLiVu0UE9NHaBdA
MINIO_SECRET_KEY=NzD2atLHCv9yUb8dYHvRbv8vQoqHOIaR
MINIO_SECURE=true
MINIO_BUCKET=photo-restoration
GOOGLE_API_KEY=your-google-api-key-here
```

**Important Notes:**
- For `MINIO_ENDPOINT`, use only the domain without `https://`
- `MINIO_SECURE=true` because your MinIO uses HTTPS
- The S3 API URL is what the backend uses (not the console URL)

## For Local Development with Production MinIO

1. Copy the production env file:
   ```bash
   cd backend
   cp .env.production .env
   ```

2. Edit `.env` and add your Google API key

3. Run the backend:
   ```bash
   uvicorn main:app --reload
   ```

## For Docker Deployment

Run with environment variables:
```bash
docker run -p 8000:8000 \
  -e MINIO_ENDPOINT=minio-gwowwcogkgk4wooogwk4ss4k.91.98.16.194.sslip.io \
  -e MINIO_ACCESS_KEY=EbLiVu0UE9NHaBdA \
  -e MINIO_SECRET_KEY=NzD2atLHCv9yUb8dYHvRbv8vQoqHOIaR \
  -e MINIO_SECURE=true \
  -e MINIO_BUCKET=photo-restoration \
  -e GOOGLE_API_KEY=your-google-api-key \
  photo-restoration-backend
```

## Your MinIO Details

- **Console URL**: https://console-gwowwcogkgk4wooogwk4ss4k.91.98.16.194.sslip.io (for web interface)
- **S3 API URL**: https://minio-gwowwcogkgk4wooogwk4ss4k.91.98.16.194.sslip.io (for backend)
- **Admin User**: EbLiVu0UE9NHaBdA
- **Admin Password**: NzD2atLHCv9yUb8dYHvRbv8vQoqHOIaR

## Testing MinIO Connection

You can test if MinIO is accessible:
```bash
curl https://minio-gwowwcogkgk4wooogwk4ss4k.91.98.16.194.sslip.io
```

## Frontend Configuration

Don't forget to set the backend URL in your frontend:
```
EXPO_PUBLIC_API_URL=https://your-backend-url
```