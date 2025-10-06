# Production Debugging Guide for Image Corruption

This guide explains how to debug image corruption in production without running standalone scripts.

## 1. Using Debug API Endpoints

### Endpoint 1: Validate Image Processing Pipeline
**POST** `/api/debug/validate-image`

This endpoint tests an image through the entire pipeline and returns detailed information about each stage.

**Usage:**
```bash
# Using curl
curl -X POST "https://your-domain.com/api/debug/validate-image" \
  -F "file=@/path/to/test-image.jpg"

# Using Postman/Insomnia
# Upload a file to POST /api/debug/validate-image
```

**Response:**
```json
{
  "original_file": {
    "filename": "test.jpg",
    "content_type": "image/jpeg",
    "size_bytes": 123456,
    "size_kb": 120.56,
    "format": "JPEG",
    "mode": "RGB",
    "dimensions": "1024x768",
    "is_valid": true
  },
  "png_conversion": {
    "size_bytes": 234567,
    "size_kb": 229.07,
    "format": "PNG",
    "mode": "RGB",
    "dimensions": "1024x768",
    "is_valid": true
  },
  "gemini_processing": {
    "size_bytes": 345678,
    "size_kb": 337.58,
    "format": "PNG",
    "mode": "RGB",
    "dimensions": "1024x1024",
    "is_valid": true,
    "first_bytes": "b'\\x89PNG\\r\\n\\x1a\\n\\x00\\x00\\x00\\rIHDR'"
  },
  "storage_upload": {
    "key": "debug/abc-123-def.png",
    "size_bytes": 345678,
    "is_valid": true
  },
  "storage_retrieval": {
    "size_bytes": 345678,
    "size_kb": 337.58,
    "format": "PNG",
    "mode": "RGB",
    "dimensions": "1024x1024",
    "is_valid": true,
    "data_integrity": "PASSED"
  },
  "summary": {
    "all_stages_valid": true,
    "total_errors": 0,
    "corruption_detected": false
  },
  "errors": []
}
```

### Endpoint 2: Test Storage Retrieval
**GET** `/api/debug/test-storage/{key}`

This endpoint retrieves an existing image from storage and validates it.

**Usage:**
```bash
# Test a specific stored image
curl "https://your-domain.com/api/debug/test-storage/enhanced/abc-123-def.png"
```

**Response:**
```json
{
  "key": "enhanced/abc-123-def.png",
  "size_bytes": 345678,
  "size_kb": 337.58,
  "format": "PNG",
  "mode": "RGB",
  "dimensions": "1024x1024",
  "is_valid": true,
  "first_20_bytes": "b'\\x89PNG\\r\\n\\x1a\\n\\x00\\x00\\x00\\rIHDR\\x00\\x00\\x04'"
}
```

## 2. Reading Production Logs

### Access Container Logs
```bash
# Docker logs (if using Docker)
docker logs <container-name> -f --tail 100

# Docker Compose
docker-compose logs -f backend

# Kubernetes
kubectl logs -f <pod-name>
```

### Log Levels to Monitor

**INFO Level** - Normal operation:
```
INFO - Starting image enhancement - Mode: enhance, Resolution: standard, Filter: None
INFO - Original image format: JPEG, mode: RGB, size: (1024, 768)
INFO - Calling Gemini API...
INFO - Gemini API call completed
INFO - Found enhanced image data: 345678 bytes
INFO - Enhanced image validation successful - format: PNG, mode: RGB, size: (1024, 1024)
INFO - Uploading image - Key: enhanced/abc-123.png, Size: 345678 bytes
INFO - Successfully uploaded image to enhanced/abc-123.png
```

**ERROR Level** - Problems detected:
```
ERROR - Enhanced image validation failed: cannot identify image file <_io.BytesIO object>
ERROR - Data integrity check failed for enhanced/abc-123.png
ERROR - Upload verification failed for enhanced/abc-123.png
```

### Key Log Patterns to Search For

**Image Corruption:**
```bash
grep "validation failed" logs.txt
grep "Data integrity" logs.txt
grep "corrupted" logs.txt
```

**Storage Issues:**
```bash
grep "Storage upload failed" logs.txt
grep "Upload verification failed" logs.txt
```

**Gemini API Issues:**
```bash
grep "Gemini enhancement failed" logs.txt
grep "No image data received from Gemini" logs.txt
```

## 3. Interpreting Debug Results

### Scenario 1: Corruption at Gemini Stage
```json
{
  "png_conversion": { "is_valid": true },
  "gemini_processing": { "is_valid": false },
  "errors": ["Gemini processing failed: cannot identify image file"]
}
```
**Diagnosis:** Gemini API is returning corrupted/invalid image data
**Solution:** Check Gemini API response format, verify API version compatibility

### Scenario 2: Corruption at Storage Stage
```json
{
  "gemini_processing": { "is_valid": true },
  "storage_upload": { "is_valid": true },
  "storage_retrieval": {
    "is_valid": false,
    "data_integrity": "FAILED"
  }
}
```
**Diagnosis:** S3/MinIO storage is corrupting data during upload/retrieval
**Solution:** Check MinIO connection, network issues, or storage configuration

### Scenario 3: Data Integrity Failure
```json
{
  "storage_retrieval": {
    "is_valid": true,
    "data_integrity": "FAILED"
  }
}
```
**Diagnosis:** Image is valid but bytes don't match (partial corruption)
**Solution:** Check for binary-mode vs text-mode issues, buffer handling

## 4. Live Production Testing

### Test with Real User Images
1. Get a corrupted image key from your database
2. Use the debug endpoint to validate it:
   ```bash
   curl "https://api.example.com/api/debug/test-storage/enhanced/CORRUPTED_KEY.png"
   ```
3. Check if it's already corrupted in storage or just corrupted when served

### Test New Upload
1. Use the validation endpoint with a test image:
   ```bash
   curl -X POST "https://api.example.com/api/debug/validate-image" \
     -F "file=@test-image.jpg"
   ```
2. Check which stage fails
3. Correlate with logs for detailed error messages

## 5. Common Corruption Causes

### Cause 1: Gemini API Response Format Change
**Symptoms:**
- `gemini_processing.is_valid = false`
- Logs show "No image data received from Gemini"

**Debug:**
```python
# Check inline_data format in logs
logger.debug(f"Response parts: {len(response.candidates[0].content.parts)}")
logger.debug(f"Part has inline_data: {part.inline_data is not None}")
```

### Cause 2: Binary Data Handling
**Symptoms:**
- Data size changes unexpectedly
- Invalid PNG headers

**Debug:**
Check first bytes in response:
```json
"first_bytes": "b'\\x89PNG\\r\\n\\x1a\\n'"  // Valid PNG
"first_bytes": "b'PK\\x03\\x04'"           // Invalid (ZIP file)
```

### Cause 3: Storage Configuration
**Symptoms:**
- Upload succeeds but retrieval fails
- Data integrity check fails

**Debug:**
- Check MinIO content type settings
- Verify bucket policies
- Test network connection stability

## 6. Quick Debugging Checklist

```
☐ Check logs for ERROR level messages
☐ Run /api/debug/validate-image with test image
☐ Check data_integrity status in response
☐ Verify Gemini API is returning valid data
☐ Test storage upload/retrieval separately
☐ Compare file sizes at each stage
☐ Validate PNG headers (should start with \x89PNG)
☐ Check if issue is consistent or intermittent
☐ Test with different image formats (JPEG, PNG, WebP)
☐ Monitor network latency during Gemini calls
```

## 7. Production Monitoring Setup

### Add Alert Rules
Monitor these log patterns:
- `ERROR.*validation failed`
- `ERROR.*Data integrity`
- `ERROR.*corrupted`
- `ERROR.*Gemini enhancement failed`

### Metrics to Track
- Success rate of image enhancements
- Average file sizes (input vs output)
- Storage upload success rate
- Data integrity check pass rate

## 8. Emergency Debugging

If you need immediate debugging without code changes:

### Option 1: Enable Debug Logging
```bash
# Set environment variable
export LOG_LEVEL=DEBUG

# Restart service
docker-compose restart backend
```

### Option 2: Download Problematic Image
```bash
# Download from S3/MinIO directly
aws s3 cp s3://bucket-name/enhanced/KEY.png ./debug-image.png

# Or use MinIO client
mc cp minio/bucket-name/enhanced/KEY.png ./debug-image.png

# Validate locally
python -c "from PIL import Image; Image.open('debug-image.png').show()"
```

### Option 3: Compare Raw Bytes
```python
# In Python console with access to storage
from app.services.storage_service import StorageService
storage = StorageService()

# Get image
data = storage.get_image("enhanced/KEY.png")

# Check PNG signature
print(data[:8])  # Should be: b'\x89PNG\r\n\x1a\n'

# Try to open
from PIL import Image
import io
img = Image.open(io.BytesIO(data))
print(f"Valid: {img.format}, {img.mode}, {img.size}")
```
