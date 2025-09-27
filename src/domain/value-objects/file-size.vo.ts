export class FileSize {
  private static readonly MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

  private constructor(private readonly bytes: number) {}

  static create(bytes: number): FileSize {
    if (bytes < 0) {
      throw new Error('File size cannot be negative');
    }

    if (bytes > this.MAX_SIZE_BYTES) {
      throw new Error(
        `File size exceeds maximum allowed size of ${this.formatBytes(this.MAX_SIZE_BYTES)}`,
      );
    }

    return new FileSize(bytes);
  }

  getBytes(): number {
    return this.bytes;
  }

  getFormatted(): string {
    return FileSize.formatBytes(this.bytes);
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
