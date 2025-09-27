import { Test, TestingModule } from '@nestjs/testing';
import { DownloadResultUseCase } from '../../../../src/application/use-cases/download-result.use-case';
import { ProcessingResultRepository } from '../../../../src/domain/repositories/processing-result.repository';
import { FileStorageService } from '../../../../src/shared/interfaces/file-storage.interface';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';
import { ProcessingResultNotFoundException } from '../../../../src/domain/exceptions/domain.exception';

describe('DownloadResultUseCase', () => {
  let useCase: DownloadResultUseCase;
  let processingResultRepository: jest.Mocked<ProcessingResultRepository>;
  let fileStorageService: jest.Mocked<FileStorageService>;

  beforeEach(async () => {
    const mockProcessingResultRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByVideoFileId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockFileStorageService = {
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
      getFileSize: jest.fn(),
      createZip: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadResultUseCase,
        {
          provide: 'ProcessingResultRepository',
          useValue: mockProcessingResultRepository,
        },
        {
          provide: 'FileStorageService',
          useValue: mockFileStorageService,
        },
      ],
    }).compile();

    useCase = module.get<DownloadResultUseCase>(DownloadResultUseCase);
    processingResultRepository = module.get('ProcessingResultRepository');
    fileStorageService = module.get('FileStorageService');
  });

  describe('execute', () => {
    it('should return zip path when file exists', async () => {
      const filename = 'frames_2025-01-01.zip';
      const zipPath = 'outputs/frames_2025-01-01.zip';
      const mockResult = ProcessingResult.create('video-123', zipPath, 10, [
        'frame1.png',
        'frame2.png',
      ]);

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockResolvedValue(true);

      const result = await useCase.execute(filename);

      expect(processingResultRepository.findAll).toHaveBeenCalledTimes(1);
      expect(fileStorageService.fileExists).toHaveBeenCalledWith(zipPath);
      expect(result).toBe(zipPath);
    });

    it('should throw ProcessingResultNotFoundException when filename not found', async () => {
      const filename = 'nonexistent.zip';
      processingResultRepository.findAll.mockResolvedValue([]);

      await expect(useCase.execute(filename)).rejects.toThrow(
        ProcessingResultNotFoundException,
      );
      await expect(useCase.execute(filename)).rejects.toThrow(
        `File ${filename} not found`,
      );

      expect(fileStorageService.fileExists).not.toHaveBeenCalled();
    });

    it('should throw ProcessingResultNotFoundException when file no longer exists', async () => {
      const filename = 'frames_2025-01-01.zip';
      const zipPath = 'outputs/frames_2025-01-01.zip';
      const mockResult = ProcessingResult.create('video-123', zipPath, 10, [
        'frame1.png',
        'frame2.png',
      ]);

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockResolvedValue(false);

      await expect(useCase.execute(filename)).rejects.toThrow(
        ProcessingResultNotFoundException,
      );
      await expect(useCase.execute(filename)).rejects.toThrow(
        `File ${filename} no longer exists`,
      );

      expect(fileStorageService.fileExists).toHaveBeenCalledWith(zipPath);
    });

    it('should find correct file among multiple results', async () => {
      const filename = 'frames_2025-01-02.zip';
      const zipPath1 = 'outputs/frames_2025-01-01.zip';
      const zipPath2 = 'outputs/frames_2025-01-02.zip';

      const mockResult1 = ProcessingResult.create('video-1', zipPath1, 5, [
        'frame1.png',
      ]);
      const mockResult2 = ProcessingResult.create('video-2', zipPath2, 10, [
        'frame1.png',
        'frame2.png',
      ]);

      processingResultRepository.findAll.mockResolvedValue([
        mockResult1,
        mockResult2,
      ]);
      fileStorageService.fileExists.mockResolvedValue(true);

      const result = await useCase.execute(filename);

      expect(fileStorageService.fileExists).toHaveBeenCalledWith(zipPath2);
      expect(result).toBe(zipPath2);
    });

    it('should handle repository errors', async () => {
      const filename = 'frames.zip';
      const error = new Error('Database error');
      processingResultRepository.findAll.mockRejectedValue(error);

      await expect(useCase.execute(filename)).rejects.toThrow('Database error');
    });

    it('should handle file storage errors', async () => {
      const filename = 'frames_2025-01-01.zip';
      const zipPath = 'outputs/frames_2025-01-01.zip';
      const mockResult = ProcessingResult.create('video-123', zipPath, 10, [
        'frame1.png',
      ]);

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockRejectedValue(
        new Error('Storage error'),
      );

      await expect(useCase.execute(filename)).rejects.toThrow('Storage error');
    });
  });
});
