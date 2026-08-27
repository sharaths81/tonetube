# Backend Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

ENV PORT=5001
EXPOSE 5001

# Start the backend
CMD ["node", "src/server.js"]
