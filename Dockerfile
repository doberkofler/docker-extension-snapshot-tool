# Build backend
FROM --platform=$BUILDPLATFORM node:24-alpine AS backend-builder
WORKDIR /build
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm i
RUN npm run build

# Build frontend
FROM --platform=$BUILDPLATFORM node:24-alpine AS client-builder
WORKDIR /ui
COPY ui/package.json /ui/package.json
COPY ui /ui
RUN npm i
RUN npm run build

# Production image
FROM node:24-alpine
LABEL org.opencontainers.image.title="Snapshot Tools" \
    org.opencontainers.image.description="Docker Desktop Snapshot Tools" \
    org.opencontainers.image.vendor="Dieter Oberkofler" \
    com.docker.desktop.extension.api.version="0.4.2" \
    com.docker.extension.screenshots="" \
    com.docker.desktop.extension.icon="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.categories="" \
    com.docker.extension.changelog=""

# Install Docker CLI
RUN apk add --no-cache docker-cli

# Extension metadata files at root
COPY docker-compose.yaml /docker-compose.yaml
COPY metadata.json /metadata.json
COPY snapshot.svg /snapshot.svg

# Frontend setup
COPY --from=client-builder /ui/build /ui

# Backend setup
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /build/dist ./dist

# Create data directory
RUN mkdir -p /data

# Start server
CMD ["node", "dist/index.js"]
