# Video Processor API Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Video Processor API service.

## Architecture

- **Video Processor API**: Main video processing service (3+ replicas with HPA)
- **PostgreSQL**: Database for video metadata and processing status
- **RabbitMQ**: Message queue for video processing jobs
- **Persistent Storage**: Shared storage for video uploads and processed files

## Prerequisites

1. Kubernetes cluster (1.21+)
2. kubectl configured
3. Persistent storage provider (supports ReadWriteMany for uploads)
4. Docker image built and pushed to `fabioctetsuo/video-processor-api`

## Quick Deploy

```bash
# Apply all resources
kubectl apply -k .

# Or apply individually
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f upload-pvc.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply-f postgres-service.yaml
kubectl apply -f rabbitmq-deployment.yaml
kubectl apply -f rabbitmq-service.yaml
kubectl apply -f video-processor-api-deployment.yaml
kubectl apply -f video-processor-api-service.yaml
kubectl apply -f video-processor-api-hpa.yaml
```

## Verification

```bash
# Check all pods are running
kubectl get pods -n video-processor

# Check services
kubectl get svc -n video-processor

# Check PVCs
kubectl get pvc -n video-processor

# Check HPA status
kubectl get hpa -n video-processor

# View logs
kubectl logs -n video-processor deployment/video-processor-api -f

# Check queue status
kubectl port-forward svc/video-rabbitmq-management 15672:15672 -n video-processor
# Access RabbitMQ management: http://localhost:15672 (guest/guest)
```

## Configuration

### Secrets
Update `secret.yaml` with base64 encoded values:
- `POSTGRES_PASSWORD`: Database password
- `RABBITMQ_DEFAULT_PASS`: RabbitMQ password

### ConfigMap
Modify `configmap.yaml` for:
- Database connections
- File upload settings
- Processing parameters

### Storage
- **postgres-pvc**: Database storage (ReadWriteOnce, 10Gi)
- **upload-pvc**: Video file storage (ReadWriteMany, 50Gi)

## Scaling

The service includes Horizontal Pod Autoscaler (HPA):
- Min replicas: 3
- Max replicas: 20
- CPU target: 70%
- Memory target: 80%
- Conservative scaling for video processing workloads

## File Processing

### Upload Flow
1. Files uploaded via API Gateway
2. Stored in shared persistent volume
3. Processing jobs queued in RabbitMQ
4. Workers process videos and extract frames
5. Results stored back to shared volume

### Storage Requirements
- **ReadWriteMany** access mode required for shared uploads
- Sufficient storage for video files and processed frames
- Consider using network-attached storage (NFS, EFS, etc.)

## Monitoring

### Health Checks
- Liveness: `GET /api/v1/videos/queue/stats`
- Readiness: `GET /api/v1/videos/queue/stats`

### Queue Monitoring
Access RabbitMQ Management UI:
```bash
kubectl port-forward svc/video-rabbitmq-management 15672:15672 -n video-processor
```

### Logs
```bash
# API logs
kubectl logs -n video-processor deployment/video-processor-api -f

# Database logs
kubectl logs -n video-processor deployment/video-postgres -f

# Queue logs
kubectl logs -n video-processor deployment/video-rabbitmq -f
```

## Dependencies

The service waits for dependencies using init containers:
- PostgreSQL must be ready
- RabbitMQ must be ready

## Troubleshooting

### Common Issues
1. **Storage**: Ensure ReadWriteMany storage class is available
2. **Permissions**: Check file system permissions in uploads directory
3. **Memory**: Video processing is memory-intensive, adjust limits accordingly
4. **Processing Time**: Long-running video jobs may need timeout adjustments

### Database Issues
```bash
# Connect to database
kubectl exec -it deployment/video-postgres -n video-processor -- psql -U video_user -d video_db
```

### Queue Issues
```bash
# Check RabbitMQ status
kubectl exec -it deployment/video-rabbitmq -n video-processor -- rabbitmq-diagnostics status
```

## Cleanup

```bash
# Delete all resources (preserves PVCs by default)
kubectl delete -k .

# Delete PVCs (WARNING: deletes all data)
kubectl delete pvc --all -n video-processor
```