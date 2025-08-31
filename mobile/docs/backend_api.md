# Backend API Documentation

## Base URL
Production: `https://api.photorestoration.app`
Development: `http://localhost:8000`

## Endpoints

### 1. Enhance Image
`POST /api/enhance`

Processes an image with AI enhancement.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (JPEG/PNG)
  - `user_id`: String (UUID)
  - `resolution`: String ("standard" | "hd")

**Response:**
```json
{
  "enhancement_id": "uuid",
  "enhanced_url": "/api/image/enhanced/uuid.jpg",
  "watermark": true,
  "processing_time": 1.5,
  "remaining_standard_credits": 10,
  "remaining_hd_credits": 5,
  "remaining_today_standard": 15,
  "remaining_today_hd": 5
}
```

### 2. Record Purchase
`POST /api/purchase`

Records an in-app purchase.

**Request:**
```json
{
  "user_id": "uuid",
  "receipt": {
    "transactionId": "1000000123456789",
    "productId": "standard_25",
    "platform": "ios"
  },
  "product_id": "standard_25",
  "platform": "ios"
}
```

**Response:**
```json
{
  "success": true,
  "purchase_id": "uuid",
  "standard_credits": 25,
  "hd_credits": 0,
  "subscription_type": null,
  "subscription_expires": null
}
```

### 3. Restore Purchases
`POST /api/restore`

Restores user's purchase history.

**Request:**
```json
{
  "user_id": "uuid",
  "receipts": []
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "standard_credits": 25,
  "hd_credits": 10,
  "subscription_type": "premium_monthly",
  "subscription_expires": "2024-02-01T00:00:00",
  "purchases": [
    {
      "purchase_id": "uuid",
      "product_id": "standard_25",
      "platform": "ios",
      "created_at": "2024-01-01T12:00:00"
    }
  ]
}
```

### 4. Track Analytics
`POST /api/analytics`

Records analytics events.

**Request:**
```json
{
  "user_id": "uuid",
  "event_type": "restore_standard",
  "event_data": {
    "processing_time": 1.5,
    "image_size": "1024x1024"
  },
  "platform": "mobile",
  "app_version": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "uuid"
}
```

### 5. Get Image
`GET /api/image/{key}`

Retrieves stored images.

**Parameters:**
- `key`: Image path (e.g., "enhanced/uuid.jpg")

**Response:**
- Content-Type: `image/jpeg`
- Binary image data

## Error Responses

All endpoints return standard error format:

```json
{
  "detail": "Error message"
}
```

Common status codes:
- 400: Bad Request
- 403: Forbidden (no credits)
- 404: Not Found
- 500: Internal Server Error

## Product IDs

**One-time Credits:**
- `standard_25`: 25 standard resolution images
- `standard_70`: 70 standard resolution images
- `standard_150`: 150 standard resolution images
- `hd_10`: 10 HD resolution images
- `hd_30`: 30 HD resolution images
- `hd_70`: 70 HD resolution images

**Subscriptions:**
- `light_monthly`: 15 standard + 5 HD per day
- `standard_monthly`: 30 standard + 10 HD per day
- `premium_monthly`: 60 standard + 25 HD per day
- `light_yearly`: Same as monthly (annual billing)
- `standard_yearly`: Same as monthly (annual billing)
- `premium_yearly`: Same as monthly (annual billing)