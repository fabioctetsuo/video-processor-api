import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

const execAsync = promisify(exec);

export class DatabaseTestSetup {
  private prismaService: PrismaService;

  constructor() {
    // Load test environment variables and force test database URL
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://test_user:test_password@localhost:5435/video_test_db?schema=public';

    // Log which database we're connecting to for safety
    console.log(`🔍 Using test database: ${process.env.DATABASE_URL}`);

    this.prismaService = new PrismaService();
  }

  async setupTestDatabase(): Promise<void> {
    try {
      console.log('🗃️  Setting up test database...');

      // Wait for database to be ready (with timeout)
      await this.waitForDatabase();

      // Run database migrations
      await this.runMigrations();

      // Clear all existing data
      await this.cleanDatabase();

      console.log('✅ Test database setup completed');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  async teardownTestDatabase(): Promise<void> {
    try {
      console.log('🧹 Cleaning up test database...');

      // Clean all data from test database
      await this.cleanDatabase();

      // Close database connections
      await this.prismaService.$disconnect();

      console.log('✅ Test database cleanup completed');
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error);
      // Don't throw here - we want tests to complete even if cleanup fails
    }
  }

  async resetBetweenTests(): Promise<void> {
    try {
      // Clean data between test scenarios but keep schema
      await this.cleanDatabase();
    } catch (error) {
      console.error('❌ Database reset between tests failed:', error);
      throw error;
    }
  }

  private async waitForDatabase(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.prismaService.$connect();
        console.log('📦 Test database is ready');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for test database... (${i + 1}/${maxRetries})`);
        if (i === maxRetries - 1) {
          throw new Error(
            `Failed to connect to test database after ${maxRetries} attempts: ${(error as Error).message}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running database migrations...');

      // Use db push instead of migrate for faster test setup
      const result = await execAsync('npx prisma db push --force-reset', {
        env: { ...process.env, NODE_ENV: 'test' },
        timeout: 30000, // 30 second timeout
      });

      if (
        result.stderr &&
        !result.stderr.includes('Database reset successful')
      ) {
        console.log('Migration warnings:', result.stderr);
      }

      console.log('✅ Database schema applied');
    } catch (error) {
      console.error('❌ Database migrations failed:', error);
      throw error;
    }
  }

  private async cleanDatabase(): Promise<void> {
    try {
      // Delete all data in correct order (respecting foreign keys)
      await this.prismaService.processingResult.deleteMany();
      await this.prismaService.videoFile.deleteMany();

      console.log('🧹 Database cleaned');
    } catch (error) {
      console.error('❌ Database cleaning failed:', error);
      throw error;
    }
  }

  // Helper method to seed test data if needed
  seedTestData(): void {
    try {
      // Add any default test data here if needed for specific tests
      console.log('🌱 Test data seeding completed');
    } catch (error) {
      console.error('❌ Test data seeding failed:', error);
      throw error;
    }
  }
}
