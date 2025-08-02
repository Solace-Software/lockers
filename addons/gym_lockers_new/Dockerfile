FROM alpine:3.19

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

# Copy application files from backup
COPY ../../temp_backup/gym_lockers/package*.json ./
RUN npm install --production

COPY ../../temp_backup/gym_lockers/client ./client
COPY ../../temp_backup/gym_lockers/src ./src
COPY ../../temp_backup/gym_lockers/routes ./routes
COPY ../../temp_backup/gym_lockers/server.js ./
COPY ../../temp_backup/gym_lockers/database.js ./
COPY ../../temp_backup/gym_lockers/init-data.js ./

# Create necessary directories
RUN mkdir -p \
    /data/gym-lockers/database \
    /data/gym-lockers/mqtt \
    /data/gym-lockers/logs \
    && chown -R root:root \
    /data/gym-lockers

# Build frontend
RUN cd client && npm install && npm run build

LABEL \
    io.hass.version="3.0.0" \
    io.hass.type="addon" \
    io.hass.arch="amd64"

CMD ["npm", "start"]