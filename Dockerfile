ARG BUILD_FROM
FROM $BUILD_FROM

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
COPY gym_lockers/package*.json ./gym_lockers/
COPY gym_lockers/client/package*.json ./gym_lockers/client/

# Install dependencies
RUN npm install
RUN cd gym_lockers && npm install
RUN cd gym_lockers/client && npm install

# Copy application files
COPY . .

# Build the frontend
RUN cd gym_lockers/client && npm run build

# Create data directory
RUN mkdir -p /data

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Expose port
EXPOSE 3001

CMD [ "/run.sh" ]