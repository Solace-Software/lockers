ARG BUILD_FROM=ghcr.io/hassio-addons/base:14.0.0
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

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
    && rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY . .

# Create necessary directories
RUN \
    mkdir -p \
        /var/lib/mysql \
        /var/log/mysql \
        /var/run/mysqld \
        /mosquitto/data \
        /mosquitto/log \
        /mosquitto/config \
        /app/data \
        /app/logs \
    && chown -R mysql:mysql \
        /var/lib/mysql \
        /var/log/mysql \
        /var/run/mysqld \
    && chown -R mosquitto:mosquitto /mosquitto \
    && chmod -R 755 /app

# Copy configuration files
COPY mosquitto.conf /mosquitto/config/mosquitto.conf
COPY supervisord.ha.conf /etc/supervisor/conf.d/supervisord.conf

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Labels
LABEL \
    io.hass.name="Gym Lockers Management System" \
    io.hass.description="A management system for gym lockers with MQTT support" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    maintainer="Solace Software <support@solace.dev>" \
    org.opencontainers.image.title="Gym Lockers Management System" \
    org.opencontainers.image.description="A management system for gym lockers with MQTT support" \
    org.opencontainers.image.vendor="Solace Software" \
    org.opencontainers.image.authors="Solace Software <support@solace.dev>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/Solace-Software/lockers" \
    org.opencontainers.image.source="https://github.com/Solace-Software/lockers" \
    org.opencontainers.image.documentation="https://github.com/Solace-Software/lockers/blob/main/README.md"

CMD [ "/run.sh" ]