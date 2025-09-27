import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('AppModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    // Clean up environment variables
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
  });

  it('should compile with default throttle settings', async () => {
    // Ensure env vars are not set to test default values
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should compile with custom throttle settings from environment variables', async () => {
    // Set custom environment variables to test the other branch
    process.env.THROTTLE_TTL = '30000';
    process.env.THROTTLE_LIMIT = '5';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should handle empty string environment variables', async () => {
    // Test behavior when env vars are empty strings (should use defaults)
    process.env.THROTTLE_TTL = '';
    process.env.THROTTLE_LIMIT = '';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should handle invalid numeric environment variables', async () => {
    // Test behavior with invalid numbers (should use defaults via parseInt)
    process.env.THROTTLE_TTL = 'invalid';
    process.env.THROTTLE_LIMIT = 'not-a-number';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should handle zero values in environment variables', async () => {
    // Test with zero values
    process.env.THROTTLE_TTL = '0';
    process.env.THROTTLE_LIMIT = '0';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should handle partial environment variable configuration', async () => {
    // Test with only one env var set
    process.env.THROTTLE_TTL = '45000';
    delete process.env.THROTTLE_LIMIT; // Use default

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();

    // Clean up and test the other scenario
    await module.close();

    delete process.env.THROTTLE_TTL; // Use default
    process.env.THROTTLE_LIMIT = '20';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
