import { FileExtension } from '../../../../src/domain/value-objects/file-extension.vo';

describe('FileExtension Value Object', () => {
  describe('create', () => {
    it('should create a valid file extension', () => {
      const extension = FileExtension.create('.mp4');
      expect(extension.getValue()).toBe('.mp4');
    });

    it('should normalize extension to lowercase', () => {
      const extension = FileExtension.create('.MP4');
      expect(extension.getValue()).toBe('.mp4');
    });

    it('should accept all supported video formats', () => {
      const supportedFormats = [
        '.mp4',
        '.avi',
        '.mov',
        '.mkv',
        '.wmv',
        '.flv',
        '.webm',
      ];

      supportedFormats.forEach((format) => {
        expect(() => FileExtension.create(format)).not.toThrow();
        expect(() => FileExtension.create(format.toUpperCase())).not.toThrow();
      });
    });

    it('should throw error for unsupported format', () => {
      expect(() => FileExtension.create('.txt')).toThrow(
        'Invalid video file extension: .txt. Supported formats: .mp4, .avi, .mov, .mkv, .wmv, .flv, .webm',
      );
    });

    it('should throw error for empty extension', () => {
      expect(() => FileExtension.create('')).toThrow(
        'Invalid video file extension',
      );
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return array of supported extensions', () => {
      const extensions = FileExtension.getSupportedExtensions();
      expect(extensions).toEqual([
        '.mp4',
        '.avi',
        '.mov',
        '.mkv',
        '.wmv',
        '.flv',
        '.webm',
      ]);
    });

    it('should return a new array instance', () => {
      const extensions1 = FileExtension.getSupportedExtensions();
      const extensions2 = FileExtension.getSupportedExtensions();
      expect(extensions1).not.toBe(extensions2);
      expect(extensions1).toEqual(extensions2);
    });
  });
});
