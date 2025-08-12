FROM alpine:3.19

# Use /bin/sh for Alpine until bash is installed
SHELL ["/bin/sh", "-o", "pipefail", "-c"]

# Install system dependencies
RUN \
    apk add --no-cache \
        nodejs \
        npm \
        mariadb \
        mariadb-client \
        mosquitto \
        mosquitto-clients \
        supervisor \
        bash \
        curl \
        python3 \
    && rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /app

# Copy package files and install dependencies
COPY gym_lockers/package*.json ./
RUN npm install --production

# Copy application files
COPY gym_lockers/client ./client
COPY gym_lockers/src ./src
COPY gym_lockers/routes ./routes
COPY gym_lockers/server.js ./
COPY gym_lockers/database.js ./
COPY gym_lockers/config.js ./
COPY gym_lockers/local-config.json ./
COPY gym_lockers/init-data.js ./

# Copy root filesystem
COPY addons/gym_lockers/rootfs /

# Add DB init script
COPY addons/gym_lockers/init-db.sh /usr/local/bin/init-db.sh
RUN chmod +x /usr/local/bin/init-db.sh

# Create necessary directories
RUN \
    mkdir -p \
        /data/gym-lockers/database \
        /data/gym-lockers/mqtt \
        /data/gym-lockers/logs \
        /var/log/supervisor \
        /var/run \
        /var/log/mysql \
        /var/log/mosquitto \
        /var/log/gym-lockers \
    && chown -R root:root \
        /data/gym-lockers

# Build frontend
RUN cd client && npm install && npm run build

# Set permissions
RUN chmod a+x /etc/services.d/gym-lockers/* \
    && chmod a+x /etc/cont-init.d/*

# Copy and setup supervisor configuration
COPY addons/gym_lockers/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Labels
LABEL \
    io.hass.name="Gym Lockers Management System" \
    io.hass.description="A management system for gym lockers with MQTT support" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    maintainer="Solace Software <support@solace-software.com>" \
    org.opencontainers.image.title="Gym Lockers Management System" \
    org.opencontainers.image.description="A management system for gym lockers with MQTT support" \
    org.opencontainers.image.vendor="Solace Software" \
    org.opencontainers.image.authors="Solace Software <support@solace-software.com>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/Solace-Software/lockers" \
    org.opencontainers.image.source="https://github.com/Solace-Software/lockers" \
    org.opencontainers.image.documentation="https://github.com/Solace-Software/lockers/blob/main/README.md"

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]