import {
  VideoFile,
  VideoProcessingStatus,
} from '../../../../src/domain/entities/video-file.entity';

describe('VideoFile Entity', () => {
  describe('create', () => {
    it('should create a video file with valid parameters', () => {
      const videoFile = VideoFile.create(
        'test-video.mp4',
        'stored-video.mp4',
        '.mp4',
        1024,
      );

      expect(videoFile.getId()).toBeDefined();
      expect(videoFile.getOriginalName()).toBe('test-video.mp4');
      expect(videoFile.getStoredName()).toBe('stored-video.mp4');
      expect(videoFile.getExtension().getValue()).toBe('.mp4');
      expect(videoFile.getSize().getBytes()).toBe(1024);
      expect(videoFile.getStatus()).toBe(VideoProcessingStatus.PENDING);
      expect(videoFile.getUploadedAt()).toBeInstanceOf(Date);
    });

    it('should throw error for invalid file extension', () => {
      expect(() => {
        VideoFile.create('test-video.txt', 'stored-video.txt', '.txt', 1024);
      }).toThrow('Invalid video file extension');
    });

    it('should throw error for negative file size', () => {
      expect(() => {
        VideoFile.create('test-video.mp4', 'stored-video.mp4', '.mp4', -1);
      }).toThrow('File size cannot be negative');
    });
  });

  describe('status transitions', () => {
    let videoFile: VideoFile;

    beforeEach(() => {
      videoFile = VideoFile.create(
        'test-video.mp4',
        'stored-video.mp4',
        '.mp4',
        1024,
      );
    });

    it('should transition from pending to processing', () => {
      videoFile.markAsProcessing();
      expect(videoFile.getStatus()).toBe(VideoProcessingStatus.PROCESSING);
      expect(videoFile.isProcessing()).toBe(true);
    });

    it('should transition from processing to completed', () => {
      videoFile.markAsProcessing();
      videoFile.markAsCompleted();

      expect(videoFile.getStatus()).toBe(VideoProcessingStatus.COMPLETED);
      expect(videoFile.isProcessed()).toBe(true);
      expect(videoFile.getProcessedAt()).toBeInstanceOf(Date);
    });

    it('should transition from processing to failed', () => {
      const errorMessage = 'Processing failed';
      videoFile.markAsProcessing();
      videoFile.markAsFailed(errorMessage);

      expect(videoFile.getStatus()).toBe(VideoProcessingStatus.FAILED);
      expect(videoFile.isFailed()).toBe(true);
      expect(videoFile.getErrorMessage()).toBe(errorMessage);
      expect(videoFile.getProcessedAt()).toBeInstanceOf(Date);
    });

    it('should throw error when marking as processing from non-pending status', () => {
      videoFile.markAsProcessing();
      expect(() => videoFile.markAsProcessing()).toThrow(
        'Video can only be marked as processing from pending status',
      );
    });

    it('should throw error when marking as completed from non-processing status', () => {
      expect(() => videoFile.markAsCompleted()).toThrow(
        'Video can only be marked as completed from processing status',
      );
    });

    it('should throw error when marking as failed from non-processing status', () => {
      expect(() => videoFile.markAsFailed('error')).toThrow(
        'Video can only be marked as failed from processing status',
      );
    });
  });
});
