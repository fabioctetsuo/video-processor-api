# Video Processor API

A scalable video processing microservice built with NestJS that handles video uploads, processing, and frame extraction using FFmpeg. Features asynchronous queue-based processing with RabbitMQ, PostgreSQL database, and comprehensive monitoring.

## Features

- 🎥 **Video Upload & Processing**: Multi-format video support with FFmpeg
- 📦 **Queue Management**: Asynchronous processing with RabbitMQ
- 🔐 **Authentication**: JWT-based user authentication and authorization
- 📊 **Monitoring**: Prometheus metrics and health checks
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 📱 **REST API**: OpenAPI/Swagger documentation
- 🐳 **Containerized**: Docker and Docker Compose ready
- ⚡ **Rate Limiting**: Built-in throttling protection
- 📡 **Webhooks**: Real-time processing notifications

## Supported Video Formats

- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)

## Architecture

The service follows clean architecture principles with distinct layers:

```
src/
├── application/          # Business logic and use cases
│   ├── consumers/        # RabbitMQ message consumers
│   ├── dto/             # Data transfer objects
│   └── use-cases/       # Application use cases
├── domain/              # Domain models and interfaces
├── infrastructure/      # External dependencies
│   ├── database/        # Prisma database service
│   ├── metrics/         # Prometheus monitoring
│   ├── repositories/    # Data persistence
│   └── services/        # External service integrations
├── presentation/        # Controllers and HTTP layer
└── shared/             # Shared utilities and services
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- RabbitMQ 3.x
- FFmpeg (included in Docker image)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone and navigate to the project
cd video-processor-api

# Start all services (API + PostgreSQL + RabbitMQ)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f video-processor-api
```

The service will be available at:
- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/health
- **Metrics**: http://localhost:3000/metrics
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start PostgreSQL and RabbitMQ
docker-compose up -d video-postgres rabbitmq

# Run database migrations
npx prisma migrate dev

# Start in development mode
npm run start:dev
```

## API Endpoints

### Video Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/videos/upload` | Upload video file |
| `GET` | `/api/v1/videos` | List user videos |
| `GET` | `/api/v1/videos/:id` | Get video details |
| `GET` | `/api/v1/videos/:id/status` | Get processing status |
| `GET` | `/api/v1/videos/:id/download` | Download processed result |
| `POST` | `/api/v1/videos/:id/process` | Process video (extract frames) |
| `POST` | `/api/v1/videos/:id/queue` | Queue video for processing |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Service health check |
| `GET` | `/metrics` | Prometheus metrics |

## Usage Examples

### Upload a Video

```bash
curl -X POST http://localhost:3000/api/v1/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@video.mp4"
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "video.mp4",
  "originalName": "my-video.mp4",
  "size": 15728640,
  "uploadedAt": "2024-01-15T10:30:00.000Z",
  "status": "uploaded",
  "userId": "user123"
}
```

### Process Video (Synchronous)

```bash
curl -X POST http://localhost:3000/api/v1/videos/123e4567-e89b-12d3-a456-426614174000/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"frameInterval": 1}'
```

### Queue Video Processing (Asynchronous)

```bash
curl -X POST http://localhost:3000/api/v1/videos/123e4567-e89b-12d3-a456-426614174000/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"frameInterval": 2}'
```

### Check Processing Status

```bash
curl -X GET http://localhost:3000/api/v1/videos/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 45,
  "startedAt": "2024-01-15T10:35:00.000Z",
  "message": "Extracting frames... (45/100)"
}
```

### Download Processed Result

```bash
curl -X GET http://localhost:3000/api/v1/videos/123e4567-e89b-12d3-a456-426614174000/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o frames.zip
```

## Configuration

### Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/video_db

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
RABBITMQ_QUEUE_NAME=video_processing_queue
RABBITMQ_EXCHANGE_NAME=video_processing_exchange
RABBITMQ_ROUTING_KEY=video.process

# File Storage
UPLOAD_PATH=/usr/src/app/uploads
OUTPUT_PATH=/usr/src/app/outputs
TEMP_PATH=/usr/src/app/temp

# Rate Limiting
THROTTLE_TTL=60000    # 60 seconds
THROTTLE_LIMIT=10     # 10 requests per TTL

# Webhooks
WEBHOOK_URL=http://your-webhook-endpoint.com
```

### Processing Options

Video processing supports various FFmpeg options:

```json
{
  "frameInterval": 1,     // Extract every Nth frame (default: 1)
  "outputFormat": "png",  // Frame format: png, jpg (default: png)
  "quality": 95,          // JPEG quality 1-100 (default: 95)
  "maxFrames": 100        // Maximum frames to extract (optional)
}
```

## Development

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# BDD/Cucumber tests
npm run test:bdd

# Test coverage
npm run test:cov

# All tests
npm run test:all
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run build
```

### Database Operations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## Monitoring

### Health Checks

The service provides comprehensive health checks:

```bash
# Basic health check
curl http://localhost:3000/api/v1/health

# Detailed health status
curl http://localhost:3000/api/v1/health/detailed
```

### Prometheus Metrics

Available metrics include:

- `http_request_duration_ms` - HTTP request duration
- `http_requests_total` - Total HTTP requests
- `video_processing_duration_ms` - Video processing duration
- `video_uploads_total` - Total video uploads
- `queue_size` - RabbitMQ queue size
- `active_processing_jobs` - Currently processing videos

Access metrics at: http://localhost:3000/metrics

### RabbitMQ Management

Monitor queue status via RabbitMQ Management UI:

- URL: http://localhost:15672
- Username: `admin`
- Password: `admin123`

## Performance

### Scaling Considerations

- **Horizontal Scaling**: Run multiple API instances behind a load balancer
- **Queue Workers**: Scale processing by adding more consumer instances
- **Database**: Use read replicas for better read performance
- **File Storage**: Consider cloud storage (S3, GCS) for production

### Performance Tuning

```env
# Increase upload limits
MAX_FILE_SIZE=100MB

# Optimize FFmpeg settings
FFMPEG_THREADS=4
FFMPEG_PRESET=fast

# Database connection pooling
DATABASE_CONNECTION_LIMIT=20
```

## Deployment

### Docker Production

```bash
# Build production image
docker build -t video-processor-api:latest .

# Run with production settings
docker run -d \
  --name video-processor \
  -p 3000:3000 \
  -e NODE_ENV=production \
  video-processor-api:latest
```

### Docker Compose Production

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests:

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/
```

## Troubleshooting

### Common Issues

**1. FFmpeg not found**
```bash
# Verify FFmpeg installation
docker exec -it video-processor-api which ffmpeg
```

**2. RabbitMQ connection failed**
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Restart RabbitMQ
docker-compose restart rabbitmq
```

**3. Database connection issues**
```bash
# Check PostgreSQL status
docker-compose logs video-postgres

# Run migrations
docker exec -it video-processor-api npx prisma migrate deploy
```

**4. Upload failures**
```bash
# Check disk space
docker exec -it video-processor-api df -h

# Check upload directory permissions
docker exec -it video-processor-api ls -la uploads/
```

### Debug Mode

Enable debug logging:

```bash
# Set log level
export LOG_LEVEL=debug

# Enable Prisma query logging
export DATABASE_URL="${DATABASE_URL}?logging=all"
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes with tests
4. Run test suite: `npm run test:all`
5. Submit a pull request

### Code Style

- TypeScript with strict mode enabled
- ESLint + Prettier for formatting
- Clean Architecture principles
- Comprehensive test coverage (>80%)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review [existing issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.