export interface FileStorageService {
  saveFile(file: Express.Multer.File, path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  getFileSize(path: string): Promise<number>;
  createZip(files: string[], outputPath: string): Promise<void>;
}
