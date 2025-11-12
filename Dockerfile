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
LABEL org.opencontainers.image.title="Snapshot Tools"
LABEL org.opencontainers.image.description="Docker Desktop Snapshot Tools"
LABEL org.opencontainers.image.vendor="Dieter Oberkofler"
LABEL com.docker.desktop.extension.api.version="0.4.2"
LABEL com.docker.extension.screenshots="[\
    {\"alt\": \"Containers\", \"url\": \"https:\/\/raw.githubusercontent.com\/doberkofler\/docker-extension-snapshot-tool\/refs\/heads\/main\/assets\/01_containers.png\"},\
    {\"alt\": \"Images\", \"url\": \"https:\/\/raw.githubusercontent.com\/doberkofler\/docker-extension-snapshot-tool\/refs\/heads\/main\/assets\/02_images.png\"}]"
LABEL com.docker.desktop.extension.icon="https://raw.githubusercontent.com/doberkofler/docker-extension-snapshot-tool/refs/heads/main/snapshot.svg"
LABEL com.docker.extension.detailed-description="\
    A Docker Desktop extension that simplifies snapshot management with a user-friendly UI.<br><br>\
    <b>Key Features:</b><br><br>\
    - Show container and allow to commit with default unique snapshot name<br>\
    - Show images and allow to save to file and remove<br>"
LABEL com.docker.extension.publisher-url="https://github.com/doberkofler/docker-extension-snapshot-tool"
LABEL com.docker.extension.additional-urls=""
LABEL com.docker.extension.categories=""
LABEL com.docker.extension.changelog="<ul><li>Initial release</li></ul>"

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
