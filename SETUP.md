# Photo Restoration App - Setup Instructions

## Required Services

### 1. MinIO (S3-compatible storage)

You need to have MinIO running for image storage. Here are your options:

#### Option A: Docker (Recommended)
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio_data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

Access MinIO console at: http://localhost:9001

#### Option B: Use external MinIO service
If you have MinIO running elsewhere, just set the environment variables accordingly.

### 2. PostgreSQL (Optional - for production)

By default, the app uses SQLite. For production, use PostgreSQL:

```bash
docker run -d \
  -p 5432:5432 \
  --name postgres \
  -e POSTGRES_USER=photoapp \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=photorestoration \
  postgres:15
```

## Environment Variables

Create a `.env` file in the backend directory:

```bash
# MinIO Configuration (REQUIRED)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET=photo-restoration

# Google Gemini API (OPTIONAL - but recommended)
GOOGLE_API_KEY=your-google-api-key

# Database (OPTIONAL - defaults to SQLite)
# DATABASE_URL=postgresql://photoapp:yourpassword@localhost/photorestoration
```

## Quick Start

1. **Start MinIO**:
   ```bash
   # Using the docker command above
   docker run -d -p 9000:9000 -p 9001:9001 --name minio -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" -v minio_data:/data quay.io/minio/minio server /data --console-address ":9001"
   ```

2. **Set up environment**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run the backend**:
   ```bash
   # Development
   pip install -r requirements.txt
   uvicorn main:app --reload

   # Or using Docker
   docker build -t photo-restoration-backend .
   docker run -p 8000:8000 --env-file .env photo-restoration-backend
   ```

## Service Dependencies

- **MinIO**: Required for image storage
- **Google Gemini API**: Optional but recommended for AI enhancement
- **PostgreSQL**: Optional, uses SQLite by default

## Troubleshooting

### MinIO Connection Refused
- Ensure MinIO is running on the correct port
- Check MINIO_ENDPOINT matches your MinIO instance
- For Docker, use `host.docker.internal:9000` instead of `localhost:9000` if backend is also in Docker

### Google API Issues
- Ensure GOOGLE_API_KEY is valid
- The app will still work without it, using basic image processing

## Production Deployment

For production in Coolify:
1. Set all environment variables in Coolify's environment section
2. Ensure MinIO is accessible from your deployment environment
3. Use PostgreSQL instead of SQLite
4. Set MINIO_SECURE=true if using HTTPS