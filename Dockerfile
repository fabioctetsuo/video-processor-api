FROM node:18-alpine AS builder

# Install ffmpeg and system dependencies
RUN apk add --no-cache ffmpeg openssl postgresql-client curl

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM node:18-alpine AS production

# Install ffmpeg and system dependencies
RUN apk add --no-cache ffmpeg openssl postgresql-client curl

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies and prisma for migrations
RUN npm ci --only=production && npm install prisma && npm cache clean --force

# Copy built application from builder
COPY --from=builder /usr/src/app/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p uploads outputs temp

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of directories
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["./docker-entrypoint.sh"]