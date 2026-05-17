import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

interface SharpInstance {
  resize(width: number, height: number, opts: { fit: string }): SharpInstance;
  webp(opts: { quality: number }): SharpInstance;
  toFile(path: string): Promise<unknown>;
}

type SharpFactory = (input: Buffer) => SharpInstance;

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly maxSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(private config: ConfigService) {
    this.uploadDir =
      process.env['UPLOAD_DIR'] ?? path.join(process.cwd(), 'uploads');
    this.baseUrl =
      process.env['UPLOAD_BASE_URL'] ?? 'http://localhost:3000/uploads';

    for (const dir of ['products', 'brands', 'avatars', 'thumbnails']) {
      const full = path.join(this.uploadDir, dir);
      if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    }
    this.logger.log('Upload dir: ' + this.uploadDir);
  }

  async uploadProductImage(
    file: UploadedFile,
    dispensaryId: string,
    productId: string,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const ext = this.getExtension(file.mimetype);
    const hash = crypto.randomBytes(8).toString('hex');
    const filename =
      dispensaryId.slice(0, 8) + '_' + productId.slice(0, 8) + '_' + hash + ext;
    const thumbFilename = 'thumb_' + filename;

    const originalPath = path.join(this.uploadDir, 'products', filename);
    fs.writeFileSync(originalPath, file.buffer);

    const thumbPath = path.join(this.uploadDir, 'thumbnails', thumbFilename);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require('sharp') as SharpFactory;
      await sharp(file.buffer)
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbPath);
    } catch {
      fs.writeFileSync(thumbPath, file.buffer);
    }

    const url = this.baseUrl + '/products/' + filename;
    const thumbnailUrl = this.baseUrl + '/thumbnails/' + thumbFilename;

    this.logger.log(
      'Image uploaded: ' +
        filename +
        ' (' +
        (file.size / 1024).toFixed(0) +
        ' KB)',
    );

    return {
      url,
      thumbnailUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadAvatar(
    file: UploadedFile,
    userId: string,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const ext = this.getExtension(file.mimetype);
    const filename =
      userId.slice(0, 8) + '_' + crypto.randomBytes(4).toString('hex') + ext;

    const filePath = path.join(this.uploadDir, 'avatars', filename);
    fs.writeFileSync(filePath, file.buffer);

    const thumbPath = path.join(this.uploadDir, 'avatars', 'sm_' + filename);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require('sharp') as SharpFactory;
      await sharp(file.buffer)
        .resize(128, 128, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbPath);
    } catch {
      fs.writeFileSync(thumbPath, file.buffer);
    }

    return {
      url: this.baseUrl + '/avatars/' + filename,
      thumbnailUrl: this.baseUrl + '/avatars/sm_' + filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  deleteFile(url: string): void {
    if (!url || !url.startsWith(this.baseUrl)) return;
    const relativePath = url.replace(this.baseUrl + '/', '');
    const fullPath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      this.logger.log('Deleted: ' + relativePath);
    }
  }

  private validateFile(file: UploadedFile | undefined | null): void {
    if (!file) throw new BadRequestException('No file provided');
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WebP',
      );
    }
    if (file.size > this.maxSize) {
      throw new BadRequestException('File too large. Maximum 5MB');
    }
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mimeType] ?? '.jpg';
  }
}
