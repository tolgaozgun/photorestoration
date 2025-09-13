# Dockerfile
FROM node:20-bullseye
RUN apt-get update && apt-get install -y git python3 build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app
USER node
COPY --chown=node:node package*.json ./
RUN npm ci --no-audit --no-fund
COPY --chown=node:node . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
    REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0 \
    CHOKIDAR_USEPOLLING=1
# NOTE: no CI=1

EXPOSE 8081 19000 19001 19002 19006
# Use npm exec so we don’t depend on global npx
CMD ["npm","exec","--yes","expo","start","--","--tunnel","--host","0.0.0.0","--non-interactive"]