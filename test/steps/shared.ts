import request from 'supertest';

// Shared context for BDD tests
class TestContext {
  public response: request.Response | null = null;
  public testFiles: any[] = [];
  public testVideoBuffers: Buffer[] = [];

  reset() {
    this.response = null;
    this.testFiles = [];
    this.testVideoBuffers = [];
  }
}

// Global test context
export const testContext = new TestContext();

// Add to global for easy access across step files
declare global {
  var testContext: TestContext;
}

global.testContext = testContext;
