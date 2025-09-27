export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class VideoFileNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Video file with id ${id} not found`);
  }
}

export class ProcessingResultNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Processing result with id ${id} not found`);
  }
}

export class InvalidFileFormatException extends DomainException {
  constructor(format: string) {
    super(`Invalid file format: ${format}`);
  }
}

export class FileSizeExceededException extends DomainException {
  constructor(size: number, maxSize: number) {
    super(`File size ${size} exceeds maximum allowed size ${maxSize}`);
  }
}

export class VideoProcessingException extends DomainException {
  constructor(message: string) {
    super(`Video processing failed: ${message}`);
  }
}
