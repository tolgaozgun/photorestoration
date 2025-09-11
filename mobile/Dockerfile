# Dockerfile (project root)
FROM node:20-bullseye

# OS deps (root)
RUN apt-get update && apt-get install -y git python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

# Create & own the app dir
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app

# Install deps as the non-root user
USER node
COPY --chown=node:node package*.json ./
# If you don't have package-lock.json, use `npm install` instead of `npm ci`
RUN npm ci --no-audit --no-fund

# Copy the rest
COPY --chown=node:node . .

# Expo-friendly env
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
    REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0 \
    CHOKIDAR_USEPOLLING=1 \
    CI=1

EXPOSE 8081 19000 19001 19002 19006
CMD ["npx", "expo", "start", "--tunnel", "--non-interactive"]