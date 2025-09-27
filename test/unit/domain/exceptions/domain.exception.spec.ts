import {
  DomainException,
  VideoFileNotFoundException,
  ProcessingResultNotFoundException,
  InvalidFileFormatException,
  FileSizeExceededException,
  VideoProcessingException,
} from '../../../../src/domain/exceptions/domain.exception';

// Create a concrete implementation for testing the abstract class
class TestDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

describe('Domain Exceptions', () => {
  describe('DomainException (abstract)', () => {
    it('should create exception with correct message and name', () => {
      const exception = new TestDomainException('Test error message');
      expect(exception.message).toBe('Test error message');
      expect(exception.name).toBe('TestDomainException');
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(DomainException);
    });
  });
  describe('VideoFileNotFoundException', () => {
    it('should create exception with correct message', () => {
      const exception = new VideoFileNotFoundException('video-123');
      expect(exception.message).toBe('Video file with id video-123 not found');
      expect(exception.name).toBe('VideoFileNotFoundException');
    });

    it('should be instance of Error', () => {
      const exception = new VideoFileNotFoundException('video-123');
      expect(exception).toBeInstanceOf(Error);
    });
  });

  describe('ProcessingResultNotFoundException', () => {
    it('should create exception with custom message', () => {
      const id = 'result-123';
      const exception = new ProcessingResultNotFoundException(id);
      expect(exception.message).toBe(
        `Processing result with id ${id} not found`,
      );
      expect(exception.name).toBe('ProcessingResultNotFoundException');
    });

    it('should be instance of Error', () => {
      const exception = new ProcessingResultNotFoundException('Not found');
      expect(exception).toBeInstanceOf(Error);
    });
  });

  describe('InvalidFileFormatException', () => {
    it('should create exception with extension message', () => {
      const exception = new InvalidFileFormatException('.txt');
      expect(exception.message).toBe('Invalid file format: .txt');
      expect(exception.name).toBe('InvalidFileFormatException');
    });

    it('should be instance of Error', () => {
      const exception = new InvalidFileFormatException('.pdf');
      expect(exception).toBeInstanceOf(Error);
    });
  });

  describe('FileSizeExceededException', () => {
    it('should create exception with size message', () => {
      const exception = new FileSizeExceededException(1000000, 500000);
      expect(exception.message).toBe(
        'File size 1000000 exceeds maximum allowed size 500000',
      );
      expect(exception.name).toBe('FileSizeExceededException');
    });

    it('should be instance of Error', () => {
      const exception = new FileSizeExceededException(2000, 1000);
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('VideoProcessingException', () => {
    it('should create exception with custom message', () => {
      const customMessage = 'Processing failed due to invalid codec';
      const exception = new VideoProcessingException(customMessage);
      expect(exception.message).toBe(
        `Video processing failed: ${customMessage}`,
      );
      expect(exception.name).toBe('VideoProcessingException');
    });

    it('should be instance of Error', () => {
      const exception = new VideoProcessingException('Processing error');
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
