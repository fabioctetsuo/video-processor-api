import { VideoProcessingResponseDto } from '../../../../src/application/dto/video-processing-response.dto';

describe('VideoProcessingResponseDto', () => {
  describe('success response', () => {
    it('should create successful response with all properties', () => {
      const dto = new VideoProcessingResponseDto();
      dto.success = true;
      dto.message = 'Video processed successfully! 15 frames extracted.';
      dto.videoId = '123e4567-e89b-12d3-a456-426614174000';
      dto.zipPath = 'frames_20231201_143052.zip';
      dto.frameCount = 15;
      dto.frameNames = ['frame_0001.png', 'frame_0002.png', 'frame_0003.png'];

      expect(dto).toBeDefined();
      expect(dto.success).toBe(true);
      expect(dto.message).toBe(
        'Video processed successfully! 15 frames extracted.',
      );
      expect(dto.videoId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.zipPath).toBe('frames_20231201_143052.zip');
      expect(dto.frameCount).toBe(15);
      expect(dto.frameNames).toEqual([
        'frame_0001.png',
        'frame_0002.png',
        'frame_0003.png',
      ]);
    });

    it('should create successful response with minimal properties', () => {
      const dto = new VideoProcessingResponseDto();
      dto.success = true;
      dto.message = 'Video queued for processing';
      dto.videoId = 'video-123';

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Video queued for processing');
      expect(dto.videoId).toBe('video-123');
      expect(dto.zipPath).toBeUndefined();
      expect(dto.frameCount).toBeUndefined();
      expect(dto.frameNames).toBeUndefined();
    });
  });

  describe('error response', () => {
    it('should create error response', () => {
      const dto = new VideoProcessingResponseDto();
      dto.success = false;
      dto.message = 'Video processing failed: Invalid format';
      dto.videoId = 'video-456';

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Video processing failed: Invalid format');
      expect(dto.videoId).toBe('video-456');
    });

    it('should handle various error scenarios', () => {
      const errorScenarios = [
        'File too large',
        'Unsupported format',
        'Processing timeout',
        'Invalid video codec',
      ];

      errorScenarios.forEach((errorMessage, index) => {
        const dto = new VideoProcessingResponseDto();
        dto.success = false;
        dto.message = `Video processing failed: ${errorMessage}`;
        dto.videoId = `video-${index}`;

        expect(dto.success).toBe(false);
        expect(dto.message).toContain(errorMessage);
      });
    });
  });

  describe('frame extraction results', () => {
    it('should handle different frame counts', () => {
      const frameCounts = [1, 5, 10, 30, 100];

      frameCounts.forEach((count) => {
        const dto = new VideoProcessingResponseDto();
        dto.success = true;
        dto.message = `Video processed successfully! ${count} frames extracted.`;
        dto.videoId = 'test-video';
        dto.frameCount = count;
        dto.frameNames = Array.from(
          { length: count },
          (_, i) => `frame_${String(i + 1).padStart(4, '0')}.png`,
        );

        expect(dto.frameCount).toBe(count);
        expect(dto.frameNames).toHaveLength(count);
        expect(dto.frameNames?.[0]).toBe('frame_0001.png');
        if (count > 1) {
          expect(dto.frameNames?.[count - 1]).toBe(
            `frame_${String(count).padStart(4, '0')}.png`,
          );
        }
      });
    });

    it('should handle empty frame extraction', () => {
      const dto = new VideoProcessingResponseDto();
      dto.success = true;
      dto.message = 'Video processed but no frames extracted';
      dto.videoId = 'empty-video';
      dto.frameCount = 0;
      dto.frameNames = [];

      expect(dto.frameCount).toBe(0);
      expect(dto.frameNames).toEqual([]);
    });
  });
});
