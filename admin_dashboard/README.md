# Photo Restoration Admin Dashboard

A modern React admin dashboard for managing the Photo Restoration app's menu items, analytics, and settings.

## Features

- **Menu Management**: Create, edit, and organize menu items with drag-and-drop functionality
- **Animated Image Upload**: Support for GIF, PNG, and WebP animated images
- **Analytics Dashboard**: Comprehensive analytics with user engagement metrics
- **Modern UI/UX**: Built with Tailwind CSS and modern design principles
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation
- **dnd-kit** for drag-and-drop functionality
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd admin_dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your backend API URL in `.env`:
```env
VITE_BACKEND_API=http://localhost:8000/api
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_API` | Your backend API URL | `http://localhost:8000/api` |

## API Integration

The dashboard integrates with your FastAPI backend through the following endpoints:

### Menu Management
- `GET /api/menu/sections` - Get all menu sections
- `GET /api/menu/items` - Get menu items
- `POST /api/menu/items` - Create new menu item
- `PUT /api/menu/items/{id}` - Update menu item
- `DELETE /api/menu/items/{id}` - Delete menu item
- `POST /api/menu/items/reorder` - Reorder menu items

### File Upload
- `POST /upload/icon` - Upload menu item icons

### Analytics
- `GET /analytics` - Get analytics data
- `GET /health` - Health check

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── analytics-dashboard.tsx
│   ├── menu-item-form.tsx
│   └── menu-item-manager.tsx
├── lib/
│   ├── api.ts        # API client
│   ├── schemas.ts    # Zod schemas
│   └── utils.ts      # Utility functions
├── App.tsx           # Main app component
└── index.css         # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Menu Item Management

### Creating Menu Items

1. Navigate to the "Menu Management" tab
2. Click "Add Menu Item" or the "+" button in any section
3. Fill in the item details:
   - **Title**: Display name for the menu item
   - **Description**: Optional description
   - **Action Type**: screen, url, action, or section
   - **Action Value**: The target screen/URL/action
   - **Section**: Which section to place the item in
   - **Sort Order**: Display order (0 = first)
   - **Icon**: Upload animated GIF, PNG, or WebP
   - **Premium**: Whether this is a premium feature
   - **Requires Auth**: Whether authentication is required

### Organizing Items

- Drag and drop items to reorder them within sections
- Use the sort order field for precise positioning
- Items are automatically saved when reordered

### Image Upload

- Supported formats: GIF, PNG, WebP (including animated)
- Maximum file size: 5MB
- Images are automatically optimized for mobile display
- Preview images before saving

## Analytics Dashboard

The analytics dashboard provides:

- **User Metrics**: Total users, active users, engagement rates
- **Usage Statistics**: Enhancement counts, feature popularity
- **Revenue Tracking**: Premium feature usage and revenue
- **Activity Timeline**: Daily usage patterns
- **Export Functionality**: Download analytics data as CSV

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Define API methods in `src/lib/api.ts`
3. Add validation schemas in `src/lib/schemas.ts`
4. Update the main app in `src/App.tsx`

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the design system in `src/index.css`
- Use the existing UI components as building blocks
- Maintain responsive design principles

### API Development

- All API calls go through the `api` client
- Use TypeScript types for request/response data
- Handle errors gracefully with user feedback
- Implement loading states for async operations

## Building for Production

```bash
npm run build
```

The build artifacts will be saved to the `dist/` folder.

## Docker Deployment

### Building the Docker Image

```bash
# Build the Docker image
docker build -t photo-restoration-admin .

# Or build with a specific tag
docker build -t photo-restoration-admin:latest .
```

### Running the Docker Container

```bash
# Run the container on port 80
docker run -d -p 80:80 --name admin-dashboard photo-restoration-admin

# Run with environment variables
docker run -d \
  -p 80:80 \
  --name admin-dashboard \
  -e VITE_BACKEND_API=https://your-api-domain.com/api \
  photo-restoration-admin

# Run with mounted volume for static assets (optional)
docker run -d \
  -p 80:80 \
  --name admin-dashboard \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf \
  photo-restoration-admin
```

### Docker Development

```bash
# Build and run in development mode
docker build -t photo-restoration-admin:dev .
docker run -d -p 3000:80 --name admin-dashboard-dev photo-restoration-admin:dev
```

### Container Management

```bash
# View running containers
docker ps

# View container logs
docker logs admin-dashboard

# Stop the container
docker stop admin-dashboard

# Remove the container
docker rm admin-dashboard

# Remove the image
docker rmi photo-restoration-admin
```

## Deployment Options

### Docker Deployment
- **Best for**: Production environments, microservices architecture
- **Pros**: Isolated environment, easy scaling, consistent across environments
- **Cons**: Larger image size, requires Docker knowledge

### Static Hosting
The dashboard can be deployed to any static hosting service:

- **Vercel**: Zero-config deployment with automatic CI/CD
- **Netlify**: Easy deployment with form handling and analytics
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3 + CloudFront**: Highly scalable and cost-effective

To deploy to static hosting, simply upload the contents of the `dist/` folder.

### Traditional Server Deployment
- **Node.js server**: Use a reverse proxy like nginx or Apache
- **PM2**: Process management for production Node.js applications
- **Kubernetes**: Container orchestration for large-scale deployments

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for type safety
3. Write component documentation
4. Test thoroughly before submitting changes

## License

This project is part of the Photo Restoration application.
