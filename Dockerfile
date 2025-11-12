# Build frontend
FROM --platform=$BUILDPLATFORM node:24-alpine AS client-builder
WORKDIR /build
COPY package.json /build
COPY ui /build/ui/
COPY shared /build/shared/
RUN npm i
WORKDIR /build/ui
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

# Setup frontend
COPY --from=client-builder /build/ui/build /ui


# Setup backend
WORKDIR /app
COPY backend/package*.json ./
COPY backend/src ./src
COPY shared/package.json ./shared/
COPY shared/src ./shared/src
RUN npm i --only=production
WORKDIR /app

# Start server
CMD ["node", "src/index.ts"]
