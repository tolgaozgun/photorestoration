# Photo Restoration App - Comprehensive Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend System](#backend-system)
4. [Mobile Application](#mobile-application)
5. [Unified Credits System](#unified-credits-system)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Features & Capabilities](#features--capabilities)
9. [Development Setup](#development-setup)
10. [Deployment](#deployment)
11. [Future Enhancements](#future-enhancements)

## Overview

The Photo Restoration App is a comprehensive AI-powered mobile application that allows users to restore and enhance old or damaged photographs using advanced machine learning models. The app provides a seamless experience for users to upload photos, apply various enhancement modes, and manage their usage through a unified credits system.

### Key Technologies
- **Backend**: Python FastAPI with SQLAlchemy ORM
- **Mobile**: React Native with Expo
- **Database**: PostgreSQL (production) / SQLite (development)
- **Storage**: MinIO S3-compatible object storage
- **AI/ML**: Google Gemini API for image enhancement
- **Authentication**: Device-based with optional email verification

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │   Database      │
│  (React Native) │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Storage       │    │   External      │
         └─────────────►│   (MinIO/S3)    │    │   Services      │
                        └─────────────────┘    │  (Gemini API)   │
                               │                └─────────────────┘
                               │                       │
                               ▼                       ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │   Analytics     │    │   Email         │
                        │   Tracking      │    │   Service       │
                        └─────────────────┘    └─────────────────┘
```

### System Components

#### 1. Backend System
- **FastAPI Framework**: Modern, fast web framework for building APIs
- **SQLAlchemy ORM**: Database abstraction and ORM
- **Pydantic Models**: Data validation and serialization
- **Alembic**: Database migrations (when needed)
- **SQLAdmin**: Admin interface for database management

#### 2. Mobile Application
- **React Native**: Cross-platform mobile development
- **Expo**: Development and build platform
- **React Navigation**: Navigation management
- **Context API**: State management
- **Axios**: HTTP client for API communication

#### 3. Database Layer
- **PostgreSQL**: Primary production database
- **SQLite**: Development database fallback
- **Connection Pooling**: Efficient database connection management
- **Automatic Table Creation**: Development-time schema setup

#### 4. Storage Layer
- **MinIO**: S3-compatible object storage
- **Image Processing**: Automatic format conversion to PNG
- **CDN Integration**: Ready for content delivery network

#### 5. External Services
- **Google Gemini API**: AI-powered image enhancement
- **Email Service**: User communication and verification
- **Analytics**: Event tracking and user behavior analysis

## Backend System

### Project Structure
```
backend/
├── app/
│   ├── __init__.py                 # App initialization
│   ├── main.py                     # FastAPI application setup
│   ├── config/
│   │   └── settings.py             # Configuration management
│   ├── models/
│   │   └── database.py             # Database models and setup
│   ├── schemas/                    # Pydantic schemas
│   │   ├── requests.py             # Request validation models
│   │   └── responses.py            # Response models
│   ├── services/                   # Business logic
│   │   ├── user_service.py         # User management
│   │   ├── enhancement_service.py  # Image enhancement
│   │   └── storage_service.py      # File storage operations
│   ├── routes/                     # API endpoints
│   │   ├── enhancement.py          # Image processing endpoints
│   │   ├── purchase.py             # Purchase management
│   │   ├── analytics.py            # Analytics tracking
│   │   └── admin.py                # Admin interface
│   └── admin/
│       └── admin_setup.py          # Admin panel configuration
├── docs/                           # API documentation
└── requirements.txt                 # Python dependencies
```

### Core Services

#### UserService
Manages user accounts, credits, and subscriptions:
- User creation and retrieval
- Credit balance management
- Subscription validation
- Daily usage limits
- Purchase processing

#### EnhancementService
Handles AI-powered image enhancement:
- Image format conversion (PNG optimization)
- Communication with Google Gemini API
- Multiple enhancement modes (enhance, colorize, de-scratch, etc.)
- Thumbnail generation
- Processing time tracking

#### StorageService
Manages file storage and retrieval:
- MinIO/S3 integration
- Original and enhanced image storage
- File URL generation
- Image retrieval with thumbnail support

### API Design Principles
- **RESTful Architecture**: Clean, resource-oriented endpoints
- **Modular Design**: Separated concerns between routes, services, and models
- **Type Safety**: Pydantic models for request/response validation
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Async Processing**: Non-blocking operations for better performance

## Mobile Application

### Project Structure
```
mobile/
├── App.tsx                        # Root application component
├── contexts/                      # React contexts
│   ├── UserContext.tsx           # User state management
│   └── AnalyticsContext.tsx       # Analytics tracking
├── screens/                       # Application screens
│   ├── HomeScreen.tsx             # Main app screen
│   ├── RestorationPreviewScreen.tsx # Image enhancement interface
│   ├── PreviewAndAdjustScreen.tsx # Result preview and adjustment
│   └── flow/                      # Flow-based screens
│       ├── PhotoInputScreen.tsx   # Photo selection
│       ├── ModeSelectionScreen.tsx # Enhancement mode selection
│       └── PreviewScreen.tsx      # Enhancement preview
├── navigation/                    # Navigation configuration
├── components/                    # Reusable UI components
├── config/                        # App configuration
│   └── api.ts                     # API endpoint configuration
├── utils/                         # Utility functions
└── docs/                          # Documentation
```

### State Management
- **UserContext**: Manages user authentication, credits, and subscription state
- **AnalyticsContext**: Handles event tracking and user behavior analytics
- **Local State**: Component-level state for UI interactions and temporary data

### Navigation Architecture
- **Stack Navigation**: Primary navigation pattern for linear flows
- **Tab Navigation**: Main app sections (Home, History, Settings)
- **Deep Linking**: Support for direct navigation to specific features

### UI/UX Design
- **Modern Design Principles**: Clean, minimal interface following 2025 design trends
- **Flow-First Approach**: Linear user journeys with clear progression
- **Mobile-First Design**: Optimized for mobile experience
- **Consistent Components**: Reusable UI primitives across the app
- **Accessibility**: Built-in accessibility features and proper contrast ratios

## Unified Credits System

### Overview
The app uses a simplified, unified credit system that replaced the previous dual-credit (standard/HD) system. Users purchase credits that can be used for any enhancement regardless of resolution or mode.

### Credit Logic
- **Single Credit Pool**: All credits are stored in a unified balance
- **One Credit per Enhancement**: Each image enhancement costs 1 credit
- **Subscription Benefits**: Subscribers receive daily credit allowances
- **Daily Limits**: Subscription-based daily usage limits
- **Watermark Logic**: Watermarks applied when users have no remaining credits

### Credit Sources
1. **Purchased Credits**: One-time credit packages (10, 25, 50, 100, 200)
2. **Subscription Credits**: Daily allowances for active subscribers
   - Light: 20 credits/day
   - Standard: 40 credits/day
   - Premium: 85 credits/day

### Credit Deduction Priority
1. **Purchased Credits**: Use purchased credits first
2. **Daily Subscription Credits**: Use daily allowance when purchased credits are exhausted
3. **Refund Logic**: Credits refunded on processing errors, with priority to daily credits

### Mobile Credit Management
- **Real-time Updates**: Credit balances updated immediately after each enhancement
- **Local State Management**: Credits stored in UserContext for instant UI updates
- **Background Sync**: Automatic synchronization with backend on app launch
- **Offline Support**: Credit validation requires network connectivity

## API Endpoints

### Core Endpoints

#### 1. Enhance Image
```
POST /api/enhance
```
Processes an image with AI enhancement.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (JPEG/PNG)
  - `user_id`: String (UUID)
  - `resolution`: String ("standard" | "hd") - maintained for UI purposes
  - `mode`: String ("enhance" | "colorize" | "de-scratch" | "enlighten" | "recreate" | "combine")

**Response:**
```json
{
  "enhancement_id": "uuid",
  "enhanced_url": "/api/image/enhanced/uuid.png",
  "watermark": true,
  "processing_time": 1.5,
  "remaining_credits": 15,
  "remaining_today": 10
}
```

#### 2. Record Purchase
```
POST /api/purchase
```
Records an in-app purchase.

**Request:**
```json
{
  "user_id": "uuid",
  "receipt": {
    "transactionId": "1000000123456789",
    "productId": "credits_25",
    "platform": "ios"
  },
  "product_id": "credits_25",
  "platform": "ios"
}
```

**Response:**
```json
{
  "success": true,
  "purchase_id": "uuid",
  "credits": 25,
  "subscription_type": null,
  "subscription_expires": null
}
```

#### 3. Restore Purchases
```
POST /api/restore
```
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
  "credits": 35,
  "subscription_type": "premium_monthly",
  "subscription_expires": "2024-02-01T00:00:00",
  "purchases": [
    {
      "purchase_id": "uuid",
      "product_id": "credits_25",
      "platform": "ios",
      "created_at": "2024-01-01T12:00:00"
    }
  ]
}
```

#### 4. Get Image
```
GET /api/image/{key:path}
```
Retrieves stored images.

**Query Parameters:**
- `thumbnail`: Boolean (optional) - Return thumbnail version

#### 5. Track Analytics
```
POST /api/analytics
```
Records analytics events.

**Request:**
```json
{
  "user_id": "uuid",
  "event_type": "screen_view",
  "event_data": {
    "screen": "home"
  },
  "platform": "ios",
  "app_version": "1.0.0"
}
```

### Utility Endpoints

#### Health Check
```
GET /health
```
Returns application health status.

#### Admin Interface
```
/admin/*
```
Database administration interface (development only).

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    credits INTEGER DEFAULT 0,
    subscription_type VARCHAR,
    subscription_expires TIMESTAMP,
    daily_credits_used INTEGER DEFAULT 0,
    daily_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_metadata JSON DEFAULT '{}'
);
```

#### Purchases
```sql
CREATE TABLE purchases (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR,
    receipt JSON,
    product_id VARCHAR,
    platform VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'completed'
);
```

#### Enhancements
```sql
CREATE TABLE enhancements (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR,
    original_url VARCHAR,
    enhanced_url VARCHAR,
    resolution VARCHAR,
    mode VARCHAR DEFAULT 'enhance',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_time FLOAT,
    watermark BOOLEAN DEFAULT TRUE
);
```

#### Analytics
```sql
CREATE TABLE analytics (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR,
    event_type VARCHAR,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    platform VARCHAR,
    app_version VARCHAR
);
```

#### Email Verifications
```sql
CREATE TABLE email_verifications (
    id VARCHAR PRIMARY KEY,
    email VARCHAR,
    device_id VARCHAR,
    device_name VARCHAR,
    verification_code VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);
```

#### Linked Devices
```sql
CREATE TABLE linked_devices (
    id VARCHAR PRIMARY KEY,
    email VARCHAR,
    device_id VARCHAR UNIQUE,
    device_name VARCHAR,
    device_type VARCHAR,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships and Indexes
- **Foreign Keys**: Proper relationships between users, purchases, and enhancements
- **Indexes**: Optimized indexes for user_id, created_at, and event_type fields
- **Performance**: Query optimization for common access patterns

## Features & Capabilities

### Core Features

#### 1. Image Enhancement
- **Multiple Enhancement Modes**:
  - Enhance: General quality improvement
  - Colorize: Black and white to color
  - De-scratch: Remove scratches and damage
  - Enlighten: Brightness and contrast adjustment
  - Recreate: AI-powered reconstruction
  - Combine: Multiple enhancement techniques

#### 2. Resolution Options
- **Standard Quality**: Balanced quality and processing speed
- **HD Quality**: Higher resolution output (maintained for UI purposes)
- **Automatic Format Conversion**: All images converted to PNG for consistency

#### 3. User Management
- **Device-Based Authentication**: Automatic user creation on first use
- **Email Verification**: Optional email linking for account recovery
- **Multi-Device Sync**: Enhancements synced across user devices
- **Purchase History**: Complete transaction record

#### 4. Credit System
- **Unified Credits**: Single credit currency for all enhancements
- **Flexible Purchasing**: Multiple credit package options
- **Subscription Plans**: Monthly and yearly subscriptions with daily credits
- **Daily Limits**: Subscription-based daily usage allowances
- **Refund Protection**: Automatic credit refund for failed enhancements

#### 5. Analytics & Insights
- **Event Tracking**: Comprehensive user behavior analytics
- **Performance Metrics**: Processing time and success rate monitoring
- **Usage Patterns**: Credit usage and enhancement preference analysis
- **Platform Analytics**: Cross-platform usage statistics

### Advanced Features

#### 1. Image Processing Pipeline
- **Pre-processing**: Automatic optimization before AI enhancement
- **Format Standardization**: Conversion to PNG for consistent quality
- **Thumbnail Generation**: Automatic thumbnail creation for gallery views
- **Storage Optimization**: Efficient file storage with CDN-ready URLs

#### 2. Error Handling & Recovery
- **Graceful Degradation**: Fallback mechanisms for service failures
- **Automatic Retry**: Intelligent retry logic for transient errors
- **User Feedback**: Clear error messages and recovery options
- **Credit Protection**: Automatic refunds for failed processing

#### 3. Admin & Monitoring
- **Database Administration**: Web-based admin interface
- **System Health**: Comprehensive health monitoring
- **Performance Metrics**: Real-time system performance tracking
- **Error Logging**: Centralized error logging and analysis

## Development Setup

### Backend Development

#### Prerequisites
- Python 3.8+
- PostgreSQL (production) or SQLite (development)
- MinIO or S3-compatible storage
- Google AI API key

#### Setup Instructions
1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd photorestoration/backend
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**:
   ```bash
   # Tables are created automatically on first run
   python -c "from app.models.database import Base; Base.metadata.create_all(bind=engine)"
   ```

5. **Run Development Server**:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

#### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/photorestoration
DB_TYPE=postgres
DB_HOST=localhost
DB_NAME=photorestoration
DB_USER=user
DB_PASSWORD=pass
DB_PORT=5432

# Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET=photo-restoration

# Google AI
GOOGLE_API_KEY=your-gemini-api-key

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@photorestoration.app

# App Settings
DEBUG=true
```

### Mobile Development

#### Prerequisites
- Node.js 16+
- Expo CLI
- iOS Simulator (iOS development)
- Android Studio (Android development)

#### Setup Instructions
1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd photorestoration/mobile
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp config/api.example.ts config/api.ts
   # Edit API base URL as needed
   ```

4. **Run Development Server**:
   ```bash
   npm start
   # or
   expo start
   ```

#### Configuration
```typescript
// config/api.ts
export const API_BASE_URL = 'http://localhost:8000';
export const API_ENDPOINTS = {
  enhance: '/api/enhance',
  purchase: '/api/purchase',
  restore: '/api/restore',
  analytics: '/api/analytics',
  health: '/health'
};
```

### Testing

#### Backend Testing
```bash
# Run syntax checks
python -m py_compile app/models/database.py
python -m py_compile app/services/user_service.py
python -m py_compile app/routes/enhancement.py

# Run structure test
python test_structure.py
```

#### Mobile Testing
```bash
# Run TypeScript checks
npx tsc --noEmit

# Run linting
npm run lint

# Run tests
npm test
```

## Deployment

### Backend Deployment

#### Production Environment
- **Cloud Platform**: AWS, Google Cloud, or Azure
- **Database**: PostgreSQL with connection pooling
- **Storage**: MinIO or AWS S3
- **Load Balancing**: Nginx or cloud load balancer
- **Monitoring**: Application performance monitoring

#### Deployment Steps
1. **Environment Configuration**:
   ```bash
   # Set production environment variables
   export DEBUG=false
   export DATABASE_URL=production-db-url
   export MINIO_ENDPOINT=production-minio-url
   ```

2. **Database Migration** (if needed):
   ```bash
   # Run any pending migrations
   alembic upgrade head
   ```

3. **Application Deployment**:
   ```bash
   # Using Gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

   # Using Docker
   docker build -t photorestoration-backend .
   docker run -p 8000:8000 photorestoration-backend
   ```

#### Production Considerations
- **Security**: HTTPS, CORS configuration, rate limiting
- **Performance**: Caching, connection pooling, CDN integration
- **Monitoring**: Logging, health checks, metrics collection
- **Backup**: Database backups, file storage backups

### Mobile Deployment

#### App Store Deployment
1. **Build for Production**:
   ```bash
   # iOS
   eas build --platform ios

   # Android
   eas build --platform android
   ```

2. **Submit to Stores**:
   - Prepare app store listings
   - Create screenshots and promotional materials
   - Configure in-app purchases
   - Submit for review

#### Over-the-Air Updates
```bash
# Publish OTA updates
eas update --branch production
```

#### Production Configuration
- **API Endpoints**: Production API URLs
- **Error Tracking**: Production error reporting
- **Analytics**: Production analytics endpoints
- **Security**: Secure storage of sensitive data

## Future Enhancements

### Planned Features

#### 1. Advanced AI Models
- **Specialized Models**: Domain-specific enhancement models
- **Batch Processing**: Multiple image enhancement
- **Custom Presets**: User-defined enhancement settings
- **AI Model Selection**: Choose between different AI providers

#### 2. User Experience Improvements
- **Offline Mode**: Local enhancement processing
- **Batch Operations**: Multiple image uploads and processing
- **Advanced Editing**: Post-enhancement adjustment tools
- **Sharing Features**: Direct social media integration

#### 3. Platform Expansion
- **Web Application**: Browser-based version
- **Desktop Application**: Native desktop apps
- **API Platform**: Third-party developer access
- **Integration Partners**: Photography software integration

#### 4. Business Features
- **Team Accounts**: Multi-user credit sharing
- **Enterprise Features**: Bulk processing and API access
- **Advanced Analytics**: Business intelligence dashboard
- **Custom Branding**: White-label solutions

### Technical Improvements

#### 1. Performance Optimization
- **Caching Layer**: Redis for frequently accessed data
- **CDN Integration**: Global content delivery
- **Database Optimization**: Query optimization and indexing
- **Image Processing**: GPU acceleration for AI processing

#### 2. Scalability Enhancements
- **Microservices**: Service decomposition for better scaling
- **Container Orchestration**: Kubernetes deployment
- **Load Balancing**: Advanced load distribution
- **Auto-scaling**: Dynamic resource allocation

#### 3. Security & Compliance
- **Advanced Authentication**: OAuth, SSO integration
- **Data Encryption**: End-to-end encryption for sensitive data
- **Compliance**: GDPR, CCPA compliance features
- **Audit Logging**: Comprehensive audit trails

### Monitoring & Maintenance

#### 1. System Monitoring
- **Performance Metrics**: Real-time performance monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **User Analytics**: Advanced user behavior analysis
- **System Health**: Infrastructure health monitoring

#### 2. Maintenance Procedures
- **Database Maintenance**: Regular optimization and cleanup
- **Backup Strategies**: Automated backup and recovery
- **Update Procedures**: Seamless deployment and rollback
- **Disaster Recovery**: Comprehensive disaster recovery plan

## Conclusion

The Photo Restoration App represents a modern, scalable solution for AI-powered image enhancement. With its unified credit system, robust architecture, and comprehensive feature set, the app is well-positioned for growth and expansion. The modular design allows for easy enhancement and adaptation to new technologies and user requirements.

The successful implementation of the unified credits system has simplified the user experience while maintaining the app's revenue potential. The combination of modern technologies, thoughtful architecture, and user-centric design creates a solid foundation for future development and success.

---

*This documentation was generated as part of the unified credits system implementation. Last updated: September 2024*