ARG BUILD_FROM
FROM $BUILD_FROM

# Install dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    mosquitto

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy application files
COPY . .

# Make scripts executable
RUN chmod +x /app/run.sh

# Setup mosquitto configuration
RUN mkdir -p /etc/mosquitto && \
    echo "listener 1883" > /etc/mosquitto/mosquitto.conf && \
    echo "allow_anonymous true" >> /etc/mosquitto/mosquitto.conf

# Set up Home Assistant addon environment
ENV \
    LANG="C.UTF-8" \
    MYSQL_HOST="" \
    MYSQL_DATABASE="gym_lockers" \
    MYSQL_USER="" \
    MYSQL_PASSWORD="" \
    MYSQL_PORT="3306"

# Labels
LABEL \
    io.hass.name="Gym Lockers Management System" \
    io.hass.description="A management system for gym lockers with MQTT support" \
    io.hass.type="addon" \
    io.hass.version="1.0.0"

# Start the application
CMD [ "/app/run.sh" ]