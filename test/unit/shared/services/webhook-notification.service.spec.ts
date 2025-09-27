import { WebhookNotificationService } from '../../../../src/shared/services/webhook-notification.service';

// Mock axios
jest.mock('axios');
const mockAxios = jest.mocked(require('axios'));

describe('WebhookNotificationService', () => {
  let service: WebhookNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variable
    delete process.env.WEBHOOK_URL;
  });

  describe('constructor', () => {
    it('should create service without webhook URL', () => {
      service = new WebhookNotificationService();
      expect(service).toBeDefined();
    });

    it('should create service with webhook URL', () => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();
      expect(service).toBeDefined();
    });
  });

  describe('sendSuccessNotification', () => {
    beforeEach(() => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();
    });

    it('should send success notification when webhook URL is configured', async () => {
      mockAxios.post.mockResolvedValue({ status: 200 });

      await service.sendSuccessNotification(
        'video-123',
        'user-456',
        'test.mp4',
        '/download/test.zip',
        10,
        'test.zip',
        new Date(),
      );

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/webhook',
        expect.objectContaining({
          event: 'video.processing.success',
          data: expect.objectContaining({
            videoId: 'video-123',
            userId: 'user-456',
            originalName: 'test.mp4',
            status: 'completed',
            downloadUrl: '/download/test.zip',
            frameCount: 10,
            zipFileName: 'test.zip',
          }),
        }),
        expect.objectContaining({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'VideoProcessor-Webhook/1.0',
          },
        }),
      );
    });

    it('should handle success notification when no webhook URL', async () => {
      delete process.env.WEBHOOK_URL;
      service = new WebhookNotificationService();

      await expect(
        service.sendSuccessNotification(
          'video-123',
          'user-456',
          'test.mp4',
          '/download/test.zip',
          10,
          'test.zip',
          new Date(),
        ),
      ).resolves.not.toThrow();

      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('sendFailureNotification', () => {
    beforeEach(() => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();
    });

    it('should send failure notification when webhook URL is configured', async () => {
      mockAxios.post.mockResolvedValue({ status: 200 });

      await service.sendFailureNotification(
        'video-123',
        'user-456',
        'test.mp4',
        'Processing failed',
        new Date(),
      );

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/webhook',
        expect.objectContaining({
          event: 'video.processing.failed',
          data: expect.objectContaining({
            videoId: 'video-123',
            userId: 'user-456',
            originalName: 'test.mp4',
            status: 'failed',
            errorMessage: 'Processing failed',
          }),
        }),
        expect.objectContaining({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'VideoProcessor-Webhook/1.0',
          },
        }),
      );
    });

    it('should handle failure notification when no webhook URL', async () => {
      delete process.env.WEBHOOK_URL;
      service = new WebhookNotificationService();

      await expect(
        service.sendFailureNotification(
          'video-123',
          'user-456',
          'test.mp4',
          'Processing failed',
          new Date(),
        ),
      ).resolves.not.toThrow();

      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should handle webhook HTTP errors', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      // Should not throw, just log error
      await expect(
        service.sendFailureNotification(
          'video-123',
          'user-456',
          'test.mp4',
          'Processing failed',
          new Date(),
        ),
      ).resolves.not.toThrow();

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendWebhook error scenarios', () => {
    beforeEach(() => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();
    });

    it('should handle webhook retry logic paths', async () => {
      // Test different retry scenarios without complex timing
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      // This will test the retry logic branches without timing complexity
      await service.sendSuccessNotification(
        'video-123',
        'user-456',
        'test.mp4',
        '/download/test.zip',
        10,
        'test.zip',
        new Date(),
      );

      expect(mockAxios.post).toHaveBeenCalled();
    });

    it('should handle different error types in webhook', async () => {
      // Test non-Error objects
      mockAxios.post.mockRejectedValue('String error');

      await service.sendFailureNotification(
        'video-123',
        'user-456',
        'test.mp4',
        'Processing failed',
        new Date(),
      );

      expect(mockAxios.post).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when no webhook URL configured', async () => {
      delete process.env.WEBHOOK_URL;
      service = new WebhookNotificationService();

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should return true for healthy webhook endpoint', async () => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();

      mockAxios.get.mockResolvedValue({ status: 200 });

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:8080/webhook/health',
        { timeout: 5000 },
      );
    });

    it('should return false for unhealthy webhook endpoint', async () => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();

      mockAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false for non-2xx status codes', async () => {
      process.env.WEBHOOK_URL = 'http://localhost:8080/webhook';
      service = new WebhookNotificationService();

      mockAxios.get.mockResolvedValue({ status: 404 });

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
