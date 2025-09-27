/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RabbitMQService } from '../src/infrastructure/services/rabbitmq.service';
import { MockRabbitMQService } from '../src/infrastructure/services/__mocks__/rabbitmq.service';
import { VideoProcessingConsumer } from '../src/application/consumers/video-processing.consumer';
import { MockVideoProcessingConsumer } from '../src/application/consumers/__mocks__/video-processing.consumer';

describe('Video Processor App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useClass(MockRabbitMQService)
      .overrideProvider(VideoProcessingConsumer)
      .useClass(MockVideoProcessingConsumer)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as in main.ts
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/videos/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/videos/status')
      .set('x-user-id', 'test-user-123')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('files');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('queue');
        expect(Array.isArray(res.body.files)).toBe(true);
      });
  });

  it('/api/v1/videos/queue/stats (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/videos/queue/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('messageCount');
        expect(res.body).toHaveProperty('consumerCount');
        expect(res.body).toHaveProperty('isConnected');
        expect(res.body).toHaveProperty('estimatedWaitTime');
      });
  });
});
