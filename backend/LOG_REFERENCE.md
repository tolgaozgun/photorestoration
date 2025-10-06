# Console Log Reference for Image Corruption Debugging

## What Logs You'll See

When you process an image, you'll see logs in this order:

### 1. API Request Received
```
INFO - app.routes.enhancement - Received enhance request: user_id=user123, mode=enhance, resolution=standard, filename=photo.jpg, content_type=image/jpeg
```

### 2. Enhancement Service Started
```
INFO - app.services.enhancement_service - Enhancement service called - mode: enhance, resolution: standard
DEBUG - app.services.enhancement_service - Input image validation successful - format: JPEG, mode: RGB, size: (1024, 768)
DEBUG - app.services.enhancement_service - Converted to PNG - original size: 123456, PNG size: 234567
```

### 3. Image Enhancement (Gemini Processing)
```
INFO - __main__ - Starting image enhancement - Mode: enhance, Resolution: standard, Filter: None
DEBUG - __main__ - Input image size: 234567 bytes
INFO - __main__ - Original image format: PNG, mode: RGB, size: (1024, 768)
DEBUG - __main__ - Target size: (1024, 1024)
DEBUG - __main__ - Resized image size: (1024, 768)
DEBUG - __main__ - Using prompt: Take this old photograph and enhance it while preserving authenticity...
INFO - __main__ - Calling Gemini API...
INFO - __main__ - Gemini API call completed
DEBUG - __main__ - Response has 1 parts
DEBUG - __main__ - Part 0: has inline_data: True
INFO - __main__ - Found enhanced image data: 345678 bytes
DEBUG - __main__ - Enhanced data first 100 bytes: b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x04...'
INFO - __main__ - Enhanced image validation successful - format: PNG, mode: RGB, size: (1024, 1024)
INFO - __main__ - Image enhancement completed successfully
```

### 4. Storage Upload
```
INFO - app.services.storage_service - Uploading original and enhanced images - Original: 234567 bytes, Enhanced: 345678 bytes
INFO - app.services.storage_service - Uploading image - Key: original/abc-123.png, Size: 234567 bytes
DEBUG - app.services.storage_service - Image validation successful - format: PNG, mode: RGB, size: (1024, 768)
INFO - app.services.storage_service - Successfully uploaded image to original/abc-123.png
DEBUG - app.services.storage_service - Retrieving image: original/abc-123.png
DEBUG - app.services.storage_service - Retrieved image original/abc-123.png: 234567 bytes
DEBUG - app.services.storage_service - Data integrity check passed for original/abc-123.png

INFO - app.services.storage_service - Uploading image - Key: enhanced/abc-123.png, Size: 345678 bytes
DEBUG - app.services.storage_service - Image validation successful - format: PNG, mode: RGB, size: (1024, 1024)
INFO - app.services.storage_service - Successfully uploaded image to enhanced/abc-123.png
DEBUG - app.services.storage_service - Retrieving image: enhanced/abc-123.png
DEBUG - app.services.storage_service - Retrieved image enhanced/abc-123.png: 345678 bytes
DEBUG - app.services.storage_service - Data integrity check passed for enhanced/abc-123.png

INFO - app.services.storage_service - Upload completed - Original key: original/abc-123.png, Enhanced key: enhanced/abc-123.png
```

### 5. Completion
```
INFO - app.routes.enhancement - Enhancement completed successfully - User: user123, Enhancement ID: 42, Mode: enhance, Resolution: standard, Processing Time: 5.23s, Watermark: False, File Size: 229.1KB -> 337.6KB
```

---

## Error Patterns to Look For

### ❌ ERROR 1: Gemini Returns Corrupted Data
```
INFO - __main__ - Found enhanced image data: 345678 bytes
DEBUG - __main__ - Enhanced data first 100 bytes: b'<html><body>Error...'  ← NOT PNG!
ERROR - __main__ - Enhanced image validation failed: cannot identify image file <_io.BytesIO object>
ERROR - __main__ - Gemini enhancement failed: Enhanced image data is corrupted
```
**This means:** Gemini API is not returning valid image data

### ❌ ERROR 2: Storage Upload Corruption
```
INFO - app.services.storage_service - Uploading image - Key: enhanced/abc-123.png, Size: 345678 bytes
DEBUG - app.services.storage_service - Image validation successful - format: PNG, mode: RGB, size: (1024, 1024)
INFO - app.services.storage_service - Successfully uploaded image to enhanced/abc-123.png
ERROR - app.services.storage_service - Data integrity check failed for enhanced/abc-123.png - retrieved size: 345000, expected: 345678
ERROR - app.services.storage_service - Upload verification failed for enhanced/abc-123.png
```
**This means:** S3/MinIO storage is corrupting data during upload

### ❌ ERROR 3: Invalid Input Image
```
ERROR - app.services.enhancement_service - Input image validation failed: cannot identify image file
```
**This means:** The uploaded file is not a valid image

### ❌ ERROR 4: PNG Conversion Failed
```
ERROR - app.services.enhancement_service - PNG conversion failed: image file is truncated
```
**This means:** Input image is corrupted or incomplete

---

## How to Capture Logs

### Docker Compose
```bash
# View live logs
docker-compose logs -f backend

# Save logs to file
docker-compose logs backend > logs.txt

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Docker
```bash
# View live logs
docker logs -f <container-id>

# Save logs to file
docker logs <container-id> > logs.txt

# With timestamps
docker logs -t <container-id> > logs.txt
```

### Kubernetes
```bash
# View live logs
kubectl logs -f <pod-name>

# Save logs to file
kubectl logs <pod-name> > logs.txt

# Previous container logs (if crashed)
kubectl logs <pod-name> --previous > logs.txt
```

---

## What to Share

When sharing logs for debugging, include:

1. **Full request flow** (from "Received enhance request" to "Enhancement completed")
2. **All ERROR and WARNING messages**
3. **The "Enhanced data first 100 bytes" line** (shows if PNG header is valid)
4. **File sizes at each stage** (Input → PNG → Enhanced → Storage)
5. **Any stack traces** (if present)

### Example Log Snippet to Share
```
2025-10-06 10:30:45 - app.routes.enhancement - INFO - Received enhance request: user_id=user123, mode=enhance, resolution=standard, filename=photo.jpg
2025-10-06 10:30:45 - __main__ - INFO - Starting image enhancement - Mode: enhance, Resolution: standard
2025-10-06 10:30:45 - __main__ - DEBUG - Input image size: 234567 bytes
2025-10-06 10:30:45 - __main__ - INFO - Original image format: PNG, mode: RGB, size: (1024, 768)
2025-10-06 10:30:50 - __main__ - INFO - Gemini API call completed
2025-10-06 10:30:50 - __main__ - INFO - Found enhanced image data: 345678 bytes
2025-10-06 10:30:50 - __main__ - DEBUG - Enhanced data first 100 bytes: b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...'
2025-10-06 10:30:50 - __main__ - INFO - Enhanced image validation successful - format: PNG, mode: RGB, size: (1024, 1024)
2025-10-06 10:30:50 - app.services.storage_service - INFO - Uploading image - Key: enhanced/abc-123.png, Size: 345678 bytes
2025-10-06 10:30:51 - app.services.storage_service - DEBUG - Data integrity check passed for enhanced/abc-123.png
2025-10-06 10:30:51 - app.routes.enhancement - INFO - Enhancement completed successfully
```

---

## Valid PNG Header Check

A valid PNG file MUST start with these bytes:
```
b'\x89PNG\r\n\x1a\n'
```

If you see something different in "Enhanced data first 100 bytes", the data is corrupted:
```
❌ b'<html><body>'           - HTML response (API error)
❌ b'{"error":'              - JSON response (API error)
❌ b'data:image/png;base64'  - Base64 encoded (needs decoding)
❌ b'PK\x03\x04'             - ZIP file (wrong format)
✅ b'\x89PNG\r\n\x1a\n'      - Valid PNG header
```

---

## Quick Debugging Steps

1. **Run an enhancement** through your mobile app
2. **Capture the logs** using one of the methods above
3. **Search for ERROR** messages: `grep ERROR logs.txt`
4. **Check PNG header**: Look for "Enhanced data first 100 bytes" in logs
5. **Share the full log section** from request to completion

This will show exactly where the corruption happens!
