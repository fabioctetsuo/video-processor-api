import { FileSize } from '../../../../src/domain/value-objects/file-size.vo';

describe('FileSize Value Object', () => {
  describe('create', () => {
    it('should create a valid file size', () => {
      const fileSize = FileSize.create(1024);
      expect(fileSize.getBytes()).toBe(1024);
    });

    it('should accept zero bytes', () => {
      const fileSize = FileSize.create(0);
      expect(fileSize.getBytes()).toBe(0);
    });

    it('should throw error for negative bytes', () => {
      expect(() => FileSize.create(-1)).toThrow('File size cannot be negative');
    });

    it('should throw error for size exceeding maximum', () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      expect(() => FileSize.create(maxSize + 1)).toThrow(
        'File size exceeds maximum allowed size',
      );
    });

    it('should accept maximum allowed size', () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      const fileSize = FileSize.create(maxSize);
      expect(fileSize.getBytes()).toBe(maxSize);
    });
  });

  describe('getFormatted', () => {
    it('should format bytes correctly', () => {
      expect(FileSize.create(0).getFormatted()).toBe('0 Bytes');
      expect(FileSize.create(1024).getFormatted()).toBe('1 KB');
      expect(FileSize.create(1536).getFormatted()).toBe('1.5 KB');
      expect(FileSize.create(1048576).getFormatted()).toBe('1 MB');
      // This test would exceed max size, so let's use a smaller value
      expect(FileSize.create(50 * 1024 * 1024).getFormatted()).toBe('50 MB');
    });

    it('should handle decimal values', () => {
      expect(FileSize.create(1536).getFormatted()).toBe('1.5 KB');
      expect(FileSize.create(2621440).getFormatted()).toBe('2.5 MB');
    });
  });
});
