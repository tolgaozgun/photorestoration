#!/bin/sh

# Environment variable substitution script for React app
# This script replaces placeholders in the built JavaScript with runtime environment variables

set -e

# Default backend API URL
DEFAULT_BACKEND_API="http://localhost:8000/api"

# Use environment variable or default
BACKEND_API="${VITE_BACKEND_API:-$DEFAULT_BACKEND_API}"

echo "Setting VITE_BACKEND_API to: $BACKEND_API"

# Find all JavaScript files in the dist directory and substitute the environment variable
find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|__VITE_BACKEND_API_PLACEHOLDER__|${BACKEND_API}|g" {} \;

# Start nginx
echo "Starting nginx..."
nginx -g "daemon off;"