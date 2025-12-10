import type { Express } from 'express';
import 'multer';

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<string>;
}
