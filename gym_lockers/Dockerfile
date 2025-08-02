ARG BUILD_FROM
FROM $BUILD_FROM

# Install required packages
RUN apk add --no-cache \
    nodejs \
    npm \
    mariadb \
    mariadb-client \
    mosquitto \
    mosquitto-clients \
    supervisor \
    bash \
    curl

WORKDIR /app

# Copy application files
COPY rootfs /
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]

# Labels
LABEL \
    io.hass.name="Gym Lockers System" \
    io.hass.description="A management system for gym lockers with MQTT support" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    io.hass.arch="${BUILD_ARCH}"