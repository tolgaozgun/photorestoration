# Docker Setup for Expo Development Server

This Docker setup creates an Expo development server that can be accessed remotely.

## Files

- `Dockerfile` - Main Dockerfile that sets up Expo development server
- `.dockerignore` - Optimizes Docker build by excluding unnecessary files

## Building and Running

```bash
# Build the Docker image
docker build -t photorestoration-mobile .

# Run the container
docker run -p 19000:19000 -p 19002:19002 -p 8081:8081 photorestoration-mobile
```

## Environment Variables

Set these in your Coolify service configuration:

```env
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
EXPO_PUBLIC_API_URL=https://your-backend-api-url
```

## Ports

The following ports are exposed:
- `19000` - Metro bundler (main connection port)
- `19002` - Expo DevTools web interface
- `8081` - React Native packager

## Connecting to the Dev Server

1. The server will start in tunnel mode and provide a URL like `exp://xx-xxx-xx-xxx.ngrok.io`
2. Check your Coolify logs for the tunnel URL
3. Use this URL in the Expo Go app on your mobile device

### Alternative Access Methods:
- **With Tailscale**: Use `exp://[tailscale-ip]:19000`
- **With Reverse Proxy**: Configure proxy to forward to port 19000

## Notes

- The dev server runs in non-interactive mode for container compatibility
- All network interfaces are bound (0.0.0.0) for remote access
- The tunnel mode is used by default for easiest remote access