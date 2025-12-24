# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Rebuild better-sqlite3 for the production image
RUN npm rebuild better-sqlite3

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server.js ./
COPY index.html ./

# Create data directory for volume mount
RUN mkdir -p /app/data

# Create a volume mount point for data persistence
VOLUME ["/app/data"]

# Expose the port
EXPOSE 3080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3080

# Start the server
CMD ["node", "server.js"]

