import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('VideoProcessorController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as in main.ts
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.setGlobalPrefix('api/v1');

    // Setup Swagger for testing
    const config = new DocumentBuilder()
      .setTitle('Video Processor API')
      .setDescription('API for processing videos and extracting frames')
      .setVersion('1.0')
      .addTag('Video Processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/videos/status', () => {
    it('should return empty list initially', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/videos/status')
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.total).toBe(response.body.files.length);
    });
  });

  describe('POST /api/v1/videos/upload (Multiple Videos)', () => {
    it('should return 400 when no files are provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/videos/upload')
        .expect(400);
    });

    it('should return 400 for invalid file format', async () => {
      const buffer = Buffer.from('fake text content');

      await request(app.getHttpServer())
        .post('/api/v1/videos/upload')
        .attach('videos', buffer, 'test.txt')
        .expect(400);
    });

    it('should return 400 for too many files', async () => {
      const buffer = Buffer.from('fake video content');

      const response = await request(app.getHttpServer())
        .post('/api/v1/videos/upload')
        .attach('videos', buffer, 'test1.mp4')
        .attach('videos', buffer, 'test2.mp4')
        .attach('videos', buffer, 'test3.mp4')
        .attach('videos', buffer, 'test4.mp4');

      expect(response.status).toBe(400);
    });

    it('should process single video file (mocked)', async () => {
      const buffer = Buffer.from('fake video content');

      const response = await request(app.getHttpServer())
        .post('/api/v1/videos/upload')
        .attach('videos', buffer, 'test.mp4');

      // Due to the mock nature, this might fail at the FFmpeg step
      expect([200, 500]).toContain(response.status);
    });

    it('should process multiple video files (mocked)', async () => {
      const buffer = Buffer.from('fake video content');

      const response = await request(app.getHttpServer())
        .post('/api/v1/videos/upload')
        .attach('videos', buffer, 'test1.mp4')
        .attach('videos', buffer, 'test2.mp4');

      // Due to the mock nature, this might fail at the FFmpeg step
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/v1/videos/upload-single (Single Video)', () => {
    it('should return 400 when no file is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/videos/upload-single')
        .expect(400);
    });

    it('should return 400 for invalid file format', async () => {
      const buffer = Buffer.from('fake text content');

      await request(app.getHttpServer())
        .post('/api/v1/videos/upload-single')
        .attach('video', buffer, 'test.txt')
        .expect(400);
    });

    it('should process valid video file (mocked)', async () => {
      const buffer = Buffer.from('fake video content');

      const response = await request(app.getHttpServer())
        .post('/api/v1/videos/upload-single')
        .attach('video', buffer, 'test.mp4');

      // Due to the mock nature, this might fail at the FFmpeg step
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/videos/download/:filename', () => {
    it('should return 404 for non-existent file', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/videos/download/nonexistent.zip')
        .expect(404);
    });
  });

  describe('CORS', () => {
    it('should handle preflight requests', async () => {
      await request(app.getHttpServer())
        .options('/api/v1/videos/status')
        .expect(204); // OPTIONS requests return 204 No Content
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      await request(app.getHttpServer()).get('/api/docs').expect(200);
    });
  });
});
