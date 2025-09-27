export class FileExtension {
  private static readonly VALID_EXTENSIONS = [
    '.mp4',
    '.avi',
    '.mov',
    '.mkv',
    '.wmv',
    '.flv',
    '.webm',
  ];

  private constructor(private readonly value: string) {}

  static create(extension: string): FileExtension {
    const normalizedExtension = extension.toLowerCase();

    if (!this.VALID_EXTENSIONS.includes(normalizedExtension)) {
      throw new Error(
        `Invalid video file extension: ${extension}. Supported formats: ${this.VALID_EXTENSIONS.join(', ')}`,
      );
    }

    return new FileExtension(normalizedExtension);
  }

  getValue(): string {
    return this.value;
  }

  static getSupportedExtensions(): string[] {
    return [...this.VALID_EXTENSIONS];
  }
}
