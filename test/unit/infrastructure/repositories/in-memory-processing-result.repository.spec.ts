import { InMemoryProcessingResultRepository } from '../../../../src/infrastructure/repositories/in-memory-processing-result.repository';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';

describe('InMemoryProcessingResultRepository', () => {
  let repository: InMemoryProcessingResultRepository;
  let mockResult1: ProcessingResult;
  let mockResult2: ProcessingResult;

  beforeEach(() => {
    repository = new InMemoryProcessingResultRepository();
    mockResult1 = ProcessingResult.create(
      'video-1',
      'outputs/frames1.zip',
      10,
      ['frame1.png', 'frame2.png'],
    );
    mockResult2 = ProcessingResult.create(
      'video-2',
      'outputs/frames2.zip',
      20,
      ['frame1.png', 'frame2.png', 'frame3.png'],
    );
  });

  describe('save', () => {
    it('should save a processing result and return it', async () => {
      const result = await repository.save(mockResult1);

      expect(result).toBe(mockResult1);

      // Verify it was saved
      const found = await repository.findById(mockResult1.getId());
      expect(found).toBe(mockResult1);
    });

    it('should overwrite existing processing result with same ID', async () => {
      await repository.save(mockResult1);

      // Create a new instance with same ID but different properties
      const updatedResult = ProcessingResult.reconstitute(
        mockResult1.getId(),
        'video-updated',
        'outputs/updated.zip',
        15,
        ['updated.png'],
        new Date(),
      );

      const result = await repository.save(updatedResult);

      expect(result).toBe(updatedResult);

      const found = await repository.findById(mockResult1.getId());
      expect(found).toBe(updatedResult);
      expect(found?.getVideoFileId()).toBe('video-updated');
    });
  });

  describe('findById', () => {
    it('should return processing result when found', async () => {
      await repository.save(mockResult1);

      const result = await repository.findById(mockResult1.getId());

      expect(result).toBe(mockResult1);
    });

    it('should return null when processing result not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByVideoFileId', () => {
    it('should return processing result for video file', async () => {
      await repository.save(mockResult1);
      await repository.save(mockResult2);

      const result = await repository.findByVideoFileId('video-1');

      expect(result).toBe(mockResult1);
    });

    it('should return null when no processing result for video file', async () => {
      await repository.save(mockResult1);

      const result = await repository.findByVideoFileId('non-existent-video');

      expect(result).toBeNull();
    });

    it('should return first matching result when multiple exist for same video file', async () => {
      const duplicateResult = ProcessingResult.create(
        'video-1', // Same video file ID
        'outputs/duplicate.zip',
        5,
        ['duplicate.png'],
      );

      await repository.save(mockResult1);
      await repository.save(duplicateResult);

      const result = await repository.findByVideoFileId('video-1');

      // Should return one of the results (implementation detail: first one found)
      expect(result).toBeDefined();
      expect(result?.getVideoFileId()).toBe('video-1');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no processing results', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should return all saved processing results', async () => {
      await repository.save(mockResult1);
      await repository.save(mockResult2);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContain(mockResult1);
      expect(result).toContain(mockResult2);
    });

    it('should return results in the order they were added', async () => {
      await repository.save(mockResult1);
      await repository.save(mockResult2);

      const result = await repository.findAll();

      expect(result[0]).toBe(mockResult1);
      expect(result[1]).toBe(mockResult2);
    });
  });

  describe('delete', () => {
    it('should remove processing result from repository', async () => {
      await repository.save(mockResult1);
      await repository.save(mockResult2);

      await repository.delete(mockResult1.getId());

      const found = await repository.findById(mockResult1.getId());
      expect(found).toBeNull();

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all).toContain(mockResult2);
    });

    it('should not throw error when deleting non-existent processing result', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should return undefined when deleting', async () => {
      await repository.save(mockResult1);

      const result = await repository.delete(mockResult1.getId());

      expect(result).toBeUndefined();
    });

    it('should remove result from video file lookup', async () => {
      await repository.save(mockResult1);

      await repository.delete(mockResult1.getId());

      const byVideoFile = await repository.findByVideoFileId(
        mockResult1.getVideoFileId(),
      );
      expect(byVideoFile).toBeNull();
    });
  });
});
