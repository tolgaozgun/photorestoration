FROM node:20-bullseye

# Install deps for native builds if needed
RUN apt-get update && apt-get install -y git python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
USER node

# Copy package files first for caching
COPY --chown=node:node package*.json ./

RUN npm ci

# Copy the rest
COPY --chown=node:node . .

# Env vars to make it work inside Docker
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
    REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0 \
    CHOKIDAR_USEPOLLING=1 \
    CI=1

EXPOSE 8081 19000 19001 19002 19006

CMD ["npx", "expo", "start", "--tunnel", "--non-interactive"]