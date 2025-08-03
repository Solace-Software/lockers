ARG BUILD_FROM
FROM $BUILD_FROM

# Install bashio for Home Assistant addon support
ARG BASHIO_VERSION=0.16.2
RUN \
    apk add --no-cache --virtual .build-dependencies \
        curl \
    \
    && mkdir -p /tmp/bashio \
    && curl -L -s \
        "https://github.com/hassio-addons/bashio/archive/v${BASHIO_VERSION}.tar.gz" \
        | tar -xzf - --strip 1 -C /tmp/bashio \
    \
    && mv /tmp/bashio/lib /usr/lib/bashio \
    && ln -s /usr/lib/bashio/bashio /usr/bin/bashio \
    && rm -rf /tmp/bashio \
    && apk del --no-cache .build-dependencies

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install Node.js and npm
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    make \
    g++ \
    sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy application files
COPY . .

# Build the frontend
RUN cd client && npm run build

# Create data directory
RUN mkdir -p /data

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Add labels for Home Assistant addon
ARG BUILD_ARCH
ARG BUILD_VERSION
LABEL \
    io.hass.name="Gym Locker Management System" \
    io.hass.description="A comprehensive gym locker management system with RFID integration and real-time monitoring" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    maintainer="Solace Software" \
    org.opencontainers.image.title="Gym Locker Management System" \
    org.opencontainers.image.description="A comprehensive gym locker management system with RFID integration and real-time monitoring" \
    org.opencontainers.image.vendor="Solace Software" \
    org.opencontainers.image.authors="Solace Software" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.source="https://github.com/Solace-Software/lockers"

# Expose port
EXPOSE 3001

CMD [ "/run.sh" ]