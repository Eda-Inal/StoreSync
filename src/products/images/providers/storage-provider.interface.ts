import type { Express } from 'express';

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<string>;
}
