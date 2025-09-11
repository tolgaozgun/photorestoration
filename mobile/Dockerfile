# Use Node.js LTS as base image
FROM node:18-alpine

# Install system dependencies required by Expo
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose the Expo dev server port
EXPOSE 8081

# Expose the Metro bundler port
EXPOSE 19000

# Expose the Expo DevTools port
EXPOSE 19002

# Set environment variables for Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Start Expo development server
# Using LAN mode for better reverse proxy compatibility
CMD ["npx", "expo", "start", "--tunnel"]