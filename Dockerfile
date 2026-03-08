# Development Dockerfile for React + TypeScript + Vite
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose Vite's default port
EXPOSE 5173

# Start the development server with host binding
# --host 0.0.0.0 allows connections from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
