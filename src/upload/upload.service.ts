import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudFrontDomain: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
    const bucketName = this.configService.get<string>('aws.s3BucketName');
    const cloudFrontDomain = this.configService.get<string>('aws.cloudFrontDomain');

    if (!region || !accessKeyId || !secretAccessKey || !bucketName || !cloudFrontDomain) {
      throw new Error('AWS configuration is incomplete');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = bucketName;
    this.cloudFrontDomain = cloudFrontDomain;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    // Return CloudFront URL for better performance
    return `https://${this.cloudFrontDomain}/${key}`;
  }

  async uploadLogo(
    file: Express.Multer.File,
    dispensaryId: string,
  ): Promise<string> {
    return this.uploadFile(file, `logos/${dispensaryId}`);
  }
}