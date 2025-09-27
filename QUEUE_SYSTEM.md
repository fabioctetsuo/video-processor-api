# 🚀 Queue-Based Video Processing System

## Overview

The Video Processor API now implements a **RabbitMQ-based messaging system** to handle peak loads and ensure **zero request loss** during high traffic periods. This system provides horizontal scalability, fault tolerance, and reliable processing guarantees.

## Architecture

```
[Client Request] → [Controller] → [Queue] → [Consumer] → [Video Processing]
```

### Key Components

1. **RabbitMQ Message Broker**
   - Persistent message storage
   - Dead letter queue handling
   - Connection reliability with auto-retry

2. **Queue Producer (Controller)**
   - Accepts video uploads
   - Queues processing requests immediately
   - Returns 202 Accepted with queue position

3. **Queue Consumer (Background Worker)**
   - Processes videos asynchronously
   - Handles up to 3 videos simultaneously
   - Automatic retry on failures

4. **Health Monitoring**
   - Queue statistics endpoint
   - Connection health checks
   - Processing metrics

## Queue System Features

### 🔒 **Reliability & Durability**
- **Persistent Queues**: Messages survive server restarts
- **Dead Letter Queue**: Failed messages are preserved for analysis
- **Acknowledgment System**: Messages are only removed after successful processing
- **Retry Logic**: Configurable retry attempts with exponential backoff

### ⚡ **Performance & Scalability**
- **Asynchronous Processing**: Non-blocking request handling
- **Concurrent Processing**: Multiple videos processed in parallel
- **Load Balancing**: Multiple consumers can be added for scaling
- **Queue Prioritization**: High-priority requests can be processed first

### 📊 **Monitoring & Observability**
- **Queue Statistics**: Real-time queue depth and consumer metrics
- **Processing Time Estimates**: Predictive wait time calculations
- **Health Checks**: System readiness and liveness probes
- **Comprehensive Logging**: Full audit trail of processing events

## API Endpoints

### Upload Videos (Queue-based)
```http
POST /api/v1/videos/upload
Content-Type: multipart/form-data

Response: 202 Accepted
{
  "success": true,
  "message": "2 video(s) uploaded and queued for processing",
  "videoIds": ["uuid1", "uuid2"],
  "queuePosition": 5,
  "estimatedProcessingTime": "3 minutes"
}
```

### Queue Statistics
```http
GET /api/v1/videos/queue/stats

Response: 200 OK
{
  "messageCount": 12,
  "consumerCount": 1,
  "isConnected": true,
  "estimatedWaitTime": "8 minutes"
}
```

### System Health
```http
GET /api/v1/health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "rabbitmq": {
      "status": "healthy",
      "connected": true
    },
    "consumer": {
      "status": "healthy",
      "queueStats": { "messageCount": 3 }
    }
  }
}
```

## Configuration

### Environment Variables
```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://user:password@localhost:5672

# Processing Configuration  
MAX_CONCURRENT_VIDEOS=3
DEFAULT_PROCESSING_PRIORITY=1
MAX_QUEUE_SIZE=1000
```

### Docker Compose Setup
```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  ports:
    - "5672:5672"     # AMQP port
    - "15672:15672"   # Management UI
  environment:
    - RABBITMQ_DEFAULT_USER=user
    - RABBITMQ_DEFAULT_PASS=password
  healthcheck:
    test: rabbitmq-diagnostics -q ping
    interval: 30s
    timeout: 10s
    retries: 3
```

## Usage

### Start the System
```bash
# Start all services including RabbitMQ
docker-compose up --build

# RabbitMQ Management UI will be available at:
# http://localhost:15672 (user/password)
```

### Monitor Queue Status
```bash
# Check queue statistics
curl http://localhost:3000/api/v1/videos/queue/stats

# Check system health  
curl http://localhost:3000/api/v1/health

# View processing status
curl http://localhost:3000/api/v1/videos/status
```

## Benefits for Peak Load Handling

### ✅ **No Request Loss**
- All upload requests are immediately queued
- Persistent storage ensures messages survive crashes
- Dead letter queue captures processing failures

### ✅ **Graceful Degradation**
- System remains responsive under heavy load
- Queue depth provides backpressure indication
- Estimated wait times help manage user expectations

### ✅ **Horizontal Scaling**
- Multiple consumer instances can be deployed
- Load is automatically distributed across consumers
- Easy to scale up/down based on demand

### ✅ **Fault Tolerance**
- Automatic reconnection to message broker
- Failed processing attempts are retried
- System continues operation if individual components fail

## Message Flow

1. **Upload Request**: Client uploads 1-3 videos
2. **Immediate Response**: Server returns 202 with queue position
3. **Background Processing**: Consumer picks up message from queue
4. **Video Processing**: FFmpeg extracts frames in parallel
5. **Result Storage**: ZIP files are created and stored
6. **Completion**: Processing results are available via status API

## Scaling Recommendations

### For High Load:
- Deploy multiple consumer instances
- Increase `MAX_CONCURRENT_VIDEOS` based on CPU/memory
- Monitor queue depth and add consumers as needed
- Use RabbitMQ clustering for broker high availability

### For Low Latency:
- Increase consumer count for faster processing
- Use message priorities for urgent requests  
- Pre-warm FFmpeg processes if needed
- Optimize video processing pipeline

This queue-based architecture ensures your video processing system can handle any load while maintaining reliability and providing excellent user experience! 🎯