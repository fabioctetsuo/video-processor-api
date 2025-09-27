import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';

describe('ProcessingResult', () => {
  const mockVideoFileId = 'video-123';
  const mockZipPath = 'outputs/frames_2025-01-01.zip';
  const mockFrameCount = 10;
  const mockFrameNames = ['frame_001.png', 'frame_002.png'];
  const mockCreatedAt = new Date('2025-01-01T00:00:00Z');

  describe('create', () => {
    it('should create a new ProcessingResult with generated ID and current date', () => {
      const result = ProcessingResult.create(
        mockVideoFileId,
        mockZipPath,
        mockFrameCount,
        mockFrameNames,
      );

      expect(result.getVideoFileId()).toBe(mockVideoFileId);
      expect(result.getZipPath()).toBe(mockZipPath);
      expect(result.getFrameCount()).toBe(mockFrameCount);
      expect(result.getFrameNames()).toEqual(mockFrameNames);
      expect(result.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(result.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create different IDs for different instances', () => {
      const result1 = ProcessingResult.create(
        mockVideoFileId,
        mockZipPath,
        mockFrameCount,
        mockFrameNames,
      );
      const result2 = ProcessingResult.create(
        mockVideoFileId,
        mockZipPath,
        mockFrameCount,
        mockFrameNames,
      );

      expect(result1.getId()).not.toBe(result2.getId());
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a ProcessingResult with provided values', () => {
      const id = 'existing-id-123';
      const result = ProcessingResult.reconstitute(
        id,
        mockVideoFileId,
        mockZipPath,
        mockFrameCount,
        mockFrameNames,
        mockCreatedAt,
      );

      expect(result.getId()).toBe(id);
      expect(result.getVideoFileId()).toBe(mockVideoFileId);
      expect(result.getZipPath()).toBe(mockZipPath);
      expect(result.getFrameCount()).toBe(mockFrameCount);
      expect(result.getFrameNames()).toEqual(mockFrameNames);
      expect(result.getCreatedAt()).toBe(mockCreatedAt);
    });
  });

  describe('getters', () => {
    let result: ProcessingResult;

    beforeEach(() => {
      result = ProcessingResult.reconstitute(
        'test-id',
        mockVideoFileId,
        mockZipPath,
        mockFrameCount,
        mockFrameNames,
        mockCreatedAt,
      );
    });

    it('should return immutable copy of frame names', () => {
      const frameNames = result.getFrameNames();
      frameNames.push('new-frame.png');

      expect(result.getFrameNames()).toEqual(mockFrameNames);
      expect(result.getFrameNames()).not.toBe(frameNames);
    });

    it('should extract filename from zip path', () => {
      expect(result.getZipFileName()).toBe('frames_2025-01-01.zip');
    });

    it('should return zip path as filename when no path separator', () => {
      const resultWithSimplePath = ProcessingResult.reconstitute(
        'test-id',
        mockVideoFileId,
        'simple-file.zip',
        mockFrameCount,
        mockFrameNames,
        mockCreatedAt,
      );

      expect(resultWithSimplePath.getZipFileName()).toBe('simple-file.zip');
    });

    it('should return zip path when path ends with separator', () => {
      const resultWithTrailingSlash = ProcessingResult.reconstitute(
        'test-id',
        mockVideoFileId,
        'path/to/',
        mockFrameCount,
        mockFrameNames,
        mockCreatedAt,
      );

      expect(resultWithTrailingSlash.getZipFileName()).toBe('path/to/');
    });
  });
});
