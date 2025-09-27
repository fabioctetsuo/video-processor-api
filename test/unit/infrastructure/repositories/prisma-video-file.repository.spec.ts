import { Test, TestingModule } from '@nestjs/testing';
import { PrismaVideoFileRepository } from '../../../../src/infrastructure/repositories/prisma-video-file.repository';
import { PrismaService } from '../../../../src/infrastructure/database/prisma.service';
import { VideoFile } from '../../../../src/domain/entities/video-file.entity';

describe('PrismaVideoFileRepository', () => {
  let repository: PrismaVideoFileRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      videoFile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaVideoFileRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaVideoFileRepository>(
      PrismaVideoFileRepository,
    );
    prismaService = module.get(PrismaService);
  });

  describe('save', () => {
    it('should save video file to database', async () => {
      const videoFile = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        'user-123',
      );
      const mockPrismaData = {
        id: videoFile.getId(),
        originalName: 'test.mp4',
        storedName: 'stored.mp4',
        extension: '.mp4',
        sizeInBytes: 1024,
        uploadedAt: videoFile.getUploadedAt(),
        userId: 'user-123',
        status: 'pending',
        processedAt: null,
        errorMessage: null,
        createdAt: videoFile.getUploadedAt(),
        updatedAt: videoFile.getUploadedAt(),
      };

      prismaService.videoFile.create.mockResolvedValue(mockPrismaData);

      const result = await repository.save(videoFile);

      expect(prismaService.videoFile.create).toHaveBeenCalledWith({
        data: {
          id: videoFile.getId(),
          originalName: 'test.mp4',
          storedName: 'stored.mp4',
          extension: '.mp4',
          sizeInBytes: 1024,
          uploadedAt: videoFile.getUploadedAt(),
          userId: 'user-123',
          status: 'pending',
        },
      });

      expect(result.getId()).toBe(videoFile.getId());
      expect(result.getOriginalName()).toBe('test.mp4');
    });
  });

  describe('findById', () => {
    it('should return video file when found', async () => {
      const videoId = 'video-123';
      const mockPrismaData = {
        id: videoId,
        originalName: 'test.mp4',
        storedName: 'stored.mp4',
        extension: '.mp4',
        sizeInBytes: 1024,
        uploadedAt: new Date(),
        userId: 'user-123',
        status: 'pending',
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.videoFile.findUnique.mockResolvedValue(mockPrismaData);

      const result = await repository.findById(videoId);

      expect(prismaService.videoFile.findUnique).toHaveBeenCalledWith({
        where: { id: videoId },
      });

      expect(result).not.toBeNull();
      expect(result?.getId()).toBe(videoId);
    });

    it('should return null when video file not found', async () => {
      prismaService.videoFile.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return user video files', async () => {
      const userId = 'user-123';
      const mockPrismaData = [
        {
          id: 'video-1',
          originalName: 'test.mp4',
          storedName: 'stored.mp4',
          extension: '.mp4',
          sizeInBytes: 1024,
          uploadedAt: new Date(),
          userId: userId,
          status: 'pending',
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.videoFile.findMany.mockResolvedValue(mockPrismaData);

      const result = await repository.findByUserId(userId);

      expect(prismaService.videoFile.findMany).toHaveBeenCalledWith({
        where: { userId: userId },
        orderBy: { uploadedAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].getUserId()).toBe(userId);
    });
  });

  describe('findAll', () => {
    it('should return all video files', async () => {
      const mockPrismaData = [
        {
          id: 'video-1',
          originalName: 'test.mp4',
          storedName: 'stored.mp4',
          extension: '.mp4',
          sizeInBytes: 1024,
          uploadedAt: new Date(),
          userId: 'user-123',
          status: 'pending',
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.videoFile.findMany.mockResolvedValue(mockPrismaData);

      const result = await repository.findAll();

      expect(prismaService.videoFile.findMany).toHaveBeenCalledWith({
        orderBy: { uploadedAt: 'desc' },
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update video file', async () => {
      const videoFile = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        'user-123',
      );
      const mockPrismaData = {
        id: videoFile.getId(),
        originalName: 'test.mp4',
        storedName: 'stored.mp4',
        extension: '.mp4',
        sizeInBytes: 1024,
        uploadedAt: videoFile.getUploadedAt(),
        userId: 'user-123',
        status: 'pending',
        processedAt: null,
        errorMessage: null,
        createdAt: videoFile.getUploadedAt(),
        updatedAt: new Date(),
      };

      prismaService.videoFile.update.mockResolvedValue(mockPrismaData);

      const result = await repository.update(videoFile);

      expect(prismaService.videoFile.update).toHaveBeenCalledWith({
        where: { id: videoFile.getId() },
        data: expect.objectContaining({
          originalName: 'test.mp4',
          storedName: 'stored.mp4',
          status: 'pending',
        }),
      });

      expect(result.getId()).toBe(videoFile.getId());
    });
  });

  describe('delete', () => {
    it('should delete video file', async () => {
      const videoId = 'video-123';
      prismaService.videoFile.delete.mockResolvedValue({} as any);

      await repository.delete(videoId);

      expect(prismaService.videoFile.delete).toHaveBeenCalledWith({
        where: { id: videoId },
      });
    });
  });
});
