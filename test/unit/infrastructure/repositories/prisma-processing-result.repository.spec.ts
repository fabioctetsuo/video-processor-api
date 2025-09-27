import { Test, TestingModule } from '@nestjs/testing';
import { PrismaProcessingResultRepository } from '../../../../src/infrastructure/repositories/prisma-processing-result.repository';
import { PrismaService } from '../../../../src/infrastructure/database/prisma.service';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';

describe('PrismaProcessingResultRepository', () => {
  let repository: PrismaProcessingResultRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      processingResult: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaProcessingResultRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaProcessingResultRepository>(
      PrismaProcessingResultRepository,
    );
    prismaService = module.get(PrismaService);
  });

  describe('save', () => {
    it('should save processing result to database', async () => {
      const processingResult = ProcessingResult.create(
        'video-123',
        'path/to/result.zip',
        5,
        ['frame1.png', 'frame2.png', 'frame3.png', 'frame4.png', 'frame5.png'],
      );

      const mockPrismaData = {
        id: processingResult.getId(),
        videoFileId: 'video-123',
        zipPath: 'path/to/result.zip',
        frameCount: 5,
        frameNames: [
          'frame1.png',
          'frame2.png',
          'frame3.png',
          'frame4.png',
          'frame5.png',
        ],
        createdAt: processingResult.getCreatedAt(),
        updatedAt: processingResult.getCreatedAt(),
      };

      prismaService.processingResult.create.mockResolvedValue(mockPrismaData);

      const result = await repository.save(processingResult);

      expect(prismaService.processingResult.create).toHaveBeenCalledWith({
        data: {
          id: processingResult.getId(),
          videoFileId: 'video-123',
          zipPath: 'path/to/result.zip',
          frameCount: 5,
          frameNames: [
            'frame1.png',
            'frame2.png',
            'frame3.png',
            'frame4.png',
            'frame5.png',
          ],
          createdAt: processingResult.getCreatedAt(),
        },
      });

      expect(result.getId()).toBe(processingResult.getId());
      expect(result.getVideoFileId()).toBe('video-123');
    });
  });

  describe('findById', () => {
    it('should return processing result when found', async () => {
      const resultId = 'result-123';
      const mockPrismaData = {
        id: resultId,
        videoFileId: 'video-123',
        zipPath: 'path/to/result.zip',
        frameCount: 5,
        frameNames: ['frame1.png', 'frame2.png'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.processingResult.findUnique.mockResolvedValue(
        mockPrismaData,
      );

      const result = await repository.findById(resultId);

      expect(prismaService.processingResult.findUnique).toHaveBeenCalledWith({
        where: { id: resultId },
      });

      expect(result).not.toBeNull();
      expect(result?.getId()).toBe(resultId);
    });

    it('should return null when processing result not found', async () => {
      prismaService.processingResult.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByVideoFileId', () => {
    it('should return processing result for video file', async () => {
      const videoFileId = 'video-123';
      const mockPrismaData = {
        id: 'result-1',
        videoFileId: videoFileId,
        zipPath: 'path/to/result.zip',
        frameCount: 3,
        frameNames: ['frame1.png', 'frame2.png', 'frame3.png'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.processingResult.findFirst.mockResolvedValue(
        mockPrismaData,
      );

      const result = await repository.findByVideoFileId(videoFileId);

      expect(prismaService.processingResult.findFirst).toHaveBeenCalledWith({
        where: { videoFileId },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).not.toBeNull();
      expect(result?.getVideoFileId()).toBe(videoFileId);
    });

    it('should return null when no results found', async () => {
      prismaService.processingResult.findFirst.mockResolvedValue(null);

      const result = await repository.findByVideoFileId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all processing results', async () => {
      const mockPrismaData = [
        {
          id: 'result-1',
          videoFileId: 'video-123',
          zipPath: 'path/to/result.zip',
          frameCount: 3,
          frameNames: ['frame1.png', 'frame2.png', 'frame3.png'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.processingResult.findMany.mockResolvedValue(mockPrismaData);

      const result = await repository.findAll();

      expect(prismaService.processingResult.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].getVideoFileId()).toBe('video-123');
    });
  });

  describe('delete', () => {
    it('should delete processing result', async () => {
      const resultId = 'result-123';
      prismaService.processingResult.delete.mockResolvedValue({} as any);

      await repository.delete(resultId);

      expect(prismaService.processingResult.delete).toHaveBeenCalledWith({
        where: { id: resultId },
      });
    });
  });
});
