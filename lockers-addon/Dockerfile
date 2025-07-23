# Step 1: Use Node.js for backend
FROM node:18 AS backend

WORKDIR /app

# Copy backend files
COPY package*.json ./
COPY . .

# Install backend dependencies
RUN npm install

# Build frontend
WORKDIR /app/client
RUN npm install
RUN npm run build

# Move build to backend public folder (if serving static)
WORKDIR /app
RUN cp -r client/build ./client_build

# Expose backend port
EXPOSE 3001

# Start backend
CMD ["npm", "run", "server"] 