import {
  ProcessingFileDto,
  ProcessingStatusResponseDto,
} from '../../../../src/application/dto/processing-status-response.dto';

describe('ProcessingStatusResponseDto', () => {
  describe('ProcessingFileDto', () => {
    it('should create a ProcessingFileDto with all properties', () => {
      const dto = new ProcessingFileDto();
      dto.filename = 'frames_20231201_143052.zip';
      dto.size = 1024768;
      dto.createdAt = '2023-12-01 14:30:52';
      dto.downloadUrl = '/api/v1/videos/download/frames_20231201_143052.zip';
      dto.frameCount = 15;

      expect(dto.filename).toBe('frames_20231201_143052.zip');
      expect(dto.size).toBe(1024768);
      expect(dto.createdAt).toBe('2023-12-01 14:30:52');
      expect(dto.downloadUrl).toBe(
        '/api/v1/videos/download/frames_20231201_143052.zip',
      );
      expect(dto.frameCount).toBe(15);
    });

    it('should allow setting properties individually', () => {
      const dto = new ProcessingFileDto();

      expect(dto.filename).toBeUndefined();
      expect(dto.size).toBeUndefined();
      expect(dto.createdAt).toBeUndefined();
      expect(dto.downloadUrl).toBeUndefined();
      expect(dto.frameCount).toBeUndefined();
    });
  });

  describe('ProcessingStatusResponseDto', () => {
    it('should create a ProcessingStatusResponseDto with files and total', () => {
      const file1 = new ProcessingFileDto();
      file1.filename = 'file1.zip';
      file1.size = 1024;
      file1.createdAt = '2023-01-01';
      file1.downloadUrl = '/download/file1.zip';
      file1.frameCount = 10;

      const file2 = new ProcessingFileDto();
      file2.filename = 'file2.zip';
      file2.size = 2048;
      file2.createdAt = '2023-01-02';
      file2.downloadUrl = '/download/file2.zip';
      file2.frameCount = 20;

      const dto = new ProcessingStatusResponseDto();
      dto.files = [file1, file2];
      dto.total = 2;

      expect(dto.files).toHaveLength(2);
      expect(dto.files[0]).toBe(file1);
      expect(dto.files[1]).toBe(file2);
      expect(dto.total).toBe(2);
    });

    it('should allow empty files array', () => {
      const dto = new ProcessingStatusResponseDto();
      dto.files = [];
      dto.total = 0;

      expect(dto.files).toEqual([]);
      expect(dto.total).toBe(0);
    });

    it('should allow setting properties individually', () => {
      const dto = new ProcessingStatusResponseDto();

      expect(dto.files).toBeUndefined();
      expect(dto.total).toBeUndefined();
    });
  });
});
