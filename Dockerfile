FROM alpine:3.19

RUN apk add --no-cache \
    nodejs \
    npm \
    mariadb \
    mariadb-client \
    mosquitto \
    supervisor

COPY ../temp_backup/gym_lockers /app

WORKDIR /app

RUN npm install --production

CMD ["npm", "start"]