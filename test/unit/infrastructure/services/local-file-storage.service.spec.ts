import { LocalFileStorageService } from '../../../../src/infrastructure/services/local-file-storage.service';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  mkdir: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  createWriteStream: jest.fn(),
  createReadStream: jest.fn(),
}));

// Mock archiver
jest.mock('archiver', () => {
  return jest.fn(() => ({
    pipe: jest.fn(),
    append: jest.fn(),
    finalize: jest.fn(),
    pointer: jest.fn().mockReturnValue(1024),
    on: jest.fn(),
  }));
});

// Mock path
jest.mock('path', () => ({
  dirname: jest.fn().mockReturnValue('/test/directory'),
  basename: jest.fn().mockReturnValue('test.txt'),
}));

const mockWriteFile = jest.mocked(require('fs/promises').writeFile);
const mockUnlink = jest.mocked(require('fs/promises').unlink);
const mockStat = jest.mocked(require('fs/promises').stat);
const mockMkdir = jest.mocked(require('fs/promises').mkdir);
const mockCreateWriteStream = jest.mocked(require('fs').createWriteStream);
const mockCreateReadStream = jest.mocked(require('fs').createReadStream);
const mockArchiver = jest.mocked(require('archiver'));

describe('LocalFileStorageService', () => {
  let service: LocalFileStorageService;

  beforeEach(() => {
    service = new LocalFileStorageService();
    jest.clearAllMocks();
  });

  describe('saveFile', () => {
    it('should save file successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;
      const filePath = '/test/path/file.txt';

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const result = await service.saveFile(mockFile, filePath);

      expect(mockMkdir).toHaveBeenCalledWith('/test/directory', {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(filePath, mockFile.buffer);
      expect(result).toBe(filePath);
    });

    it('should handle save file error', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;
      const filePath = '/test/path/file.txt';
      const error = new Error('Write failed');

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(error);

      await expect(service.saveFile(mockFile, filePath)).rejects.toThrow(
        'Write failed',
      );
    });

    it('should handle mkdir error', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;
      const filePath = '/test/path/file.txt';
      const error = new Error('Mkdir failed');

      mockMkdir.mockRejectedValue(error);

      await expect(service.saveFile(mockFile, filePath)).rejects.toThrow(
        'Mkdir failed',
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const filePath = '/test/path/file.txt';
      mockUnlink.mockResolvedValue();

      await service.deleteFile(filePath);

      expect(mockUnlink).toHaveBeenCalledWith(filePath);
    });

    it('should handle delete file error gracefully', async () => {
      const filePath = '/test/path/file.txt';
      const error = new Error('Delete failed');
      mockUnlink.mockRejectedValue(error);

      // Should not throw, just log warning
      await expect(service.deleteFile(filePath)).resolves.not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const filePath = '/test/path/file.txt';
      mockStat.mockResolvedValue({ size: 1024 } as any);

      const result = await service.fileExists(filePath);

      expect(mockStat).toHaveBeenCalledWith(filePath);
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      const filePath = '/test/path/nonexistent.txt';
      mockStat.mockRejectedValue(new Error('File not found'));

      const result = await service.fileExists(filePath);

      expect(result).toBe(false);
    });
  });

  describe('getFileSize', () => {
    it('should return file size successfully', async () => {
      const filePath = '/test/path/file.txt';
      mockStat.mockResolvedValue({ size: 2048 } as any);

      const result = await service.getFileSize(filePath);

      expect(mockStat).toHaveBeenCalledWith(filePath);
      expect(result).toBe(2048);
    });

    it('should throw error when stat fails', async () => {
      const filePath = '/test/path/file.txt';
      const error = new Error('Stat failed');
      mockStat.mockRejectedValue(error);

      await expect(service.getFileSize(filePath)).rejects.toThrow(
        'Stat failed',
      );
    });
  });

  describe('createZip', () => {
    it('should create zip successfully', async () => {
      const files = ['/test/file1.txt', '/test/file2.txt'];
      const outputPath = '/test/output.zip';

      const mockOutput = {
        on: jest.fn(),
      };
      const mockArchive = {
        pipe: jest.fn(),
        append: jest.fn(),
        finalize: jest.fn().mockResolvedValue(undefined),
        pointer: jest.fn().mockReturnValue(1024),
        on: jest.fn(),
      };

      mockMkdir.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue(mockOutput as any);
      mockArchiver.mockReturnValue(mockArchive as any);
      mockCreateReadStream.mockReturnValue({} as any);

      // Mock the output 'close' event
      mockOutput.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'close') {
            setTimeout(callback, 10);
          }
          return mockOutput;
        },
      );

      const resultPromise = service.createZip(files, outputPath);

      // Wait for the promise to resolve
      await resultPromise;

      expect(mockMkdir).toHaveBeenCalledWith('/test/directory', {
        recursive: true,
      });
      expect(mockCreateWriteStream).toHaveBeenCalledWith(outputPath);
      expect(mockArchive.pipe).toHaveBeenCalledWith(mockOutput);
      expect(mockArchive.append).toHaveBeenCalledTimes(2);
      expect(mockArchive.finalize).toHaveBeenCalled();
    });

    it('should handle zip creation error', async () => {
      const files = ['/test/file1.txt'];
      const outputPath = '/test/output.zip';

      const mockOutput = {
        on: jest.fn(),
      };
      const mockArchive = {
        pipe: jest.fn(),
        append: jest.fn(),
        finalize: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
      };

      mockMkdir.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue(mockOutput as any);
      mockArchiver.mockReturnValue(mockArchive as any);

      // Mock archive error
      mockArchive.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Zip error')), 10);
          }
        },
      );

      await expect(service.createZip(files, outputPath)).rejects.toThrow(
        'Zip error',
      );
    });

    it('should handle mkdir error in createZip', async () => {
      const files = ['/test/file1.txt'];
      const outputPath = '/test/output.zip';
      const error = new Error('Mkdir failed');

      mockMkdir.mockRejectedValue(error);

      await expect(service.createZip(files, outputPath)).rejects.toThrow(
        'Mkdir failed',
      );
    });
  });
});
