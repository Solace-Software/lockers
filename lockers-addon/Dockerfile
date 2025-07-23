# Build frontend
FROM node:18 AS frontend
WORKDIR /frontend
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# Build backend
FROM node:18 AS backend
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Copy frontend build to backend (if needed)
COPY --from=frontend /frontend/client/build ./client_build

EXPOSE 3001
CMD ["npm", "run", "server"] 