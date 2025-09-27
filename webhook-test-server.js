// Simple webhook test server for development
// Run with: node webhook-test-server.js

const http = require('http');

const PORT = 8080;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Webhook endpoint
  if (req.url === '/' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const webhook = JSON.parse(body);

        console.log('\n=== WEBHOOK RECEIVED ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Event:', webhook.event);
        console.log('Video ID:', webhook.data.videoId);
        console.log('User ID:', webhook.data.userId);
        console.log('Original Name:', webhook.data.originalName);
        console.log('Status:', webhook.data.status);

        if (webhook.event === 'video.processing.success') {
          console.log('Download URL:', webhook.data.downloadUrl);
          console.log('Frame Count:', webhook.data.frameCount);
          console.log('ZIP Filename:', webhook.data.zipFileName);
          console.log('Processed At:', webhook.data.processedAt);
        } else if (webhook.event === 'video.processing.failed') {
          console.log('Error Message:', webhook.data.errorMessage);
          console.log('Failed At:', webhook.data.processedAt);
        }

        console.log('Full Payload:', JSON.stringify(webhook, null, 2));
        console.log('========================\n');

        // Respond with success
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            received: true,
            timestamp: new Date().toISOString(),
            event: webhook.event,
          }),
        );
      } catch (error) {
        console.error('Error parsing webhook:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Default 404 response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🪝 Webhook test server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Webhook endpoint: http://localhost:${PORT}/`);
  console.log('\nWaiting for webhooks...\n');
});
