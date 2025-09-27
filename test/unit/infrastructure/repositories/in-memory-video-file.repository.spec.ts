import { InMemoryVideoFileRepository } from '../../../../src/infrastructure/repositories/in-memory-video-file.repository';
import { VideoFile } from '../../../../src/domain/entities/video-file.entity';

describe('InMemoryVideoFileRepository', () => {
  let repository: InMemoryVideoFileRepository;
  let mockVideoFile1: VideoFile;
  let mockVideoFile2: VideoFile;

  beforeEach(() => {
    repository = new InMemoryVideoFileRepository();
    mockVideoFile1 = VideoFile.create(
      'video1.mp4',
      'stored1.mp4',
      '.mp4',
      1024,
      'user-1',
    );
    mockVideoFile2 = VideoFile.create(
      'video2.mp4',
      'stored2.mp4',
      '.mp4',
      2048,
      'user-2',
    );
  });

  describe('save', () => {
    it('should save a video file and return it', async () => {
      const result = await repository.save(mockVideoFile1);

      expect(result).toBe(mockVideoFile1);

      // Verify it was saved
      const found = await repository.findById(mockVideoFile1.getId());
      expect(found).toBe(mockVideoFile1);
    });

    it('should overwrite existing video file with same ID', async () => {
      await repository.save(mockVideoFile1);

      // Create a new instance with same ID but different properties
      const updatedVideo = VideoFile.reconstitute(
        mockVideoFile1.getId(),
        'updated.mp4',
        'updated-stored.mp4',
        '.mp4',
        4096,
        new Date(),
        'user-1',
        'completed',
      );

      const result = await repository.save(updatedVideo);

      expect(result).toBe(updatedVideo);

      const found = await repository.findById(mockVideoFile1.getId());
      expect(found).toBe(updatedVideo);
      expect(found?.getOriginalName()).toBe('updated.mp4');
    });
  });

  describe('findById', () => {
    it('should return video file when found', async () => {
      await repository.save(mockVideoFile1);

      const result = await repository.findById(mockVideoFile1.getId());

      expect(result).toBe(mockVideoFile1);
    });

    it('should return null when video file not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no video files', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should return all saved video files', async () => {
      await repository.save(mockVideoFile1);
      await repository.save(mockVideoFile2);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContain(mockVideoFile1);
      expect(result).toContain(mockVideoFile2);
    });
  });

  describe('findByUserId', () => {
    it('should return empty array when user has no video files', async () => {
      await repository.save(mockVideoFile1);

      const result = await repository.findByUserId('different-user');

      expect(result).toEqual([]);
    });

    it('should return only video files for specified user', async () => {
      const userVideo1 = VideoFile.create(
        'vid1.mp4',
        'stored1.mp4',
        '.mp4',
        1024,
        'user-123',
      );
      const userVideo2 = VideoFile.create(
        'vid2.mp4',
        'stored2.mp4',
        '.mp4',
        2048,
        'user-123',
      );
      const otherUserVideo = VideoFile.create(
        'vid3.mp4',
        'stored3.mp4',
        '.mp4',
        3072,
        'other-user',
      );

      await repository.save(userVideo1);
      await repository.save(userVideo2);
      await repository.save(otherUserVideo);

      const result = await repository.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(result).toContain(userVideo1);
      expect(result).toContain(userVideo2);
      expect(result).not.toContain(otherUserVideo);
    });

    it('should return all video files for user when user has multiple files', async () => {
      const userId = 'test-user';
      const video1 = VideoFile.create(
        'vid1.mp4',
        'stored1.mp4',
        '.mp4',
        1024,
        userId,
      );
      const video2 = VideoFile.create(
        'vid2.mp4',
        'stored2.mp4',
        '.mp4',
        2048,
        userId,
      );

      await repository.save(video1);
      await repository.save(video2);

      const result = await repository.findByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result.every((video) => video.getUserId() === userId)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update existing video file', async () => {
      await repository.save(mockVideoFile1);

      const updatedVideo = VideoFile.reconstitute(
        mockVideoFile1.getId(),
        'updated.mp4',
        'updated-stored.mp4',
        '.mp4',
        4096,
        new Date(),
        'user-1',
        'completed',
      );

      const result = await repository.update(updatedVideo);

      expect(result).toBe(updatedVideo);

      const found = await repository.findById(mockVideoFile1.getId());
      expect(found).toBe(updatedVideo);
      expect(found?.getOriginalName()).toBe('updated.mp4');
    });

    it('should add new video file if it does not exist', async () => {
      const result = await repository.update(mockVideoFile1);

      expect(result).toBe(mockVideoFile1);

      const found = await repository.findById(mockVideoFile1.getId());
      expect(found).toBe(mockVideoFile1);
    });
  });

  describe('delete', () => {
    it('should remove video file from repository', async () => {
      await repository.save(mockVideoFile1);
      await repository.save(mockVideoFile2);

      await repository.delete(mockVideoFile1.getId());

      const found = await repository.findById(mockVideoFile1.getId());
      expect(found).toBeNull();

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all).toContain(mockVideoFile2);
    });

    it('should not throw error when deleting non-existent video file', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should return undefined when deleting', async () => {
      await repository.save(mockVideoFile1);

      const result = await repository.delete(mockVideoFile1.getId());

      expect(result).toBeUndefined();
    });
  });
});
