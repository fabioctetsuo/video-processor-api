import { Injectable, Logger } from '@nestjs/common';
import { writeFile, unlink, stat, mkdir } from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { FileStorageService } from '../../shared/interfaces/file-storage.interface';

@Injectable()
export class LocalFileStorageService implements FileStorageService {
  private readonly logger = new Logger(LocalFileStorageService.name);

  async saveFile(file: Express.Multer.File, filePath: string): Promise<string> {
    try {
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });

      await writeFile(filePath, file.buffer);
      this.logger.log(`File saved: ${filePath}`);

      return filePath;
    } catch (error) {
      this.logger.error(`Failed to save file: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      return stats.size;
    } catch (error) {
      this.logger.error(
        `Failed to get file size for ${filePath}: ${error.message}`,
      );
      throw error;
    }
  }

  async createZip(files: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(outputPath);
      mkdir(dir, { recursive: true })
        .then(() => {
          const output = createWriteStream(outputPath);
          const archive = archiver('zip', { zlib: { level: 9 } });

          output.on('close', () => {
            this.logger.log(
              `ZIP created: ${outputPath} (${archive.pointer()} bytes)`,
            );
            resolve();
          });

          archive.on('error', (err) => {
            this.logger.error(`ZIP creation failed: ${err.message}`);
            reject(err);
          });

          archive.pipe(output);

          files.forEach((file) => {
            const fileName = path.basename(file);
            archive.append(createReadStream(file), { name: fileName });
          });

          archive.finalize();
        })
        .catch(reject);
    });
  }
}
