import { BeforeAll, AfterAll, Before } from '@cucumber/cucumber';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { RabbitMQService } from '../../src/infrastructure/services/rabbitmq.service';
import { MockRabbitMQService } from '../../src/infrastructure/services/__mocks__/rabbitmq.service';
import { VideoProcessingConsumer } from '../../src/application/consumers/video-processing.consumer';
import { MockVideoProcessingConsumer } from '../../src/application/consumers/__mocks__/video-processing.consumer';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { DatabaseTestSetup } from '../setup/database-setup';
import './shared';

// Configuration: Set to 'real' to use actual test database, 'mock' for mocked database
const DATABASE_MODE = process.env.BDD_DATABASE_MODE || 'mock';

// Global variables shared across all step files
declare global {
  var app: INestApplication;
  var dbSetup: DatabaseTestSetup | null;
}

BeforeAll(async function () {
  console.log(`🚀 Starting BDD tests in ${DATABASE_MODE} database mode`);

  let moduleFixture;

  if (DATABASE_MODE === 'real') {
    // Real database mode - setup test database
    global.dbSetup = new DatabaseTestSetup();
    await global.dbSetup.setupTestDatabase();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useClass(MockRabbitMQService)
      .overrideProvider(VideoProcessingConsumer)
      .useClass(MockVideoProcessingConsumer)
      .compile();
  } else {
    // Mock database mode (default)
    global.dbSetup = null;

    // Create mock PrismaService to prevent real database connections
    const mockPrismaService = {
      videoFile: {
        create: (data: any) => {
          const videoFile = {
            id: `mock-video-${Date.now()}`,
            originalName: data.data.originalName || 'test.mp4',
            storedName: data.data.storedName || 'stored-test.mp4',
            extension: data.data.extension || '.mp4',
            sizeInBytes: data.data.sizeInBytes || 1024,
            uploadedAt: new Date(),
            userId: data.data.userId || 'test-user-123',
            status: 'pending' as const,
            processedAt: null,
            errorMessage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return videoFile;
        },
        findMany: () => [],
        findUnique: () => null,
        update: (params: any) => params.data,
        delete: () => ({ id: 'deleted-id' }),
      },
      processingResult: {
        create: (data: any) => ({
          ...data.data,
          id: `result-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: () => [],
        findUnique: () => null,
        findFirst: () => null,
        delete: () => ({ id: 'deleted-result' }),
      },
      $connect: () => undefined,
      $disconnect: () => undefined,
      onModuleInit: () => undefined,
      onModuleDestroy: () => undefined,
    };

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useClass(MockRabbitMQService)
      .overrideProvider(VideoProcessingConsumer)
      .useClass(MockVideoProcessingConsumer)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();
  }

  global.app = moduleFixture.createNestApplication();

  // Apply same configuration as main app
  global.app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  global.app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  global.app.setGlobalPrefix('api/v1');
  await global.app.init();
});

Before(async function () {
  // Reset test context before each scenario
  global.testContext.reset();

  // Reset database between test scenarios if using real database
  if (global.dbSetup) {
    await global.dbSetup.resetBetweenTests();
  }
});

AfterAll(async function () {
  console.log('🧹 Cleaning up BDD test environment...');

  // Close the application
  if (global.app) {
    await global.app.close();
  }

  // Cleanup test database if using real database
  if (global.dbSetup) {
    await global.dbSetup.teardownTestDatabase();
  }

  console.log('✅ BDD test cleanup completed');
});
