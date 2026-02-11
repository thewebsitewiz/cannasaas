import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private configService;
    private s3Client;
    private bucketName;
    private cloudFrontDomain;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
    uploadLogo(file: Express.Multer.File, dispensaryId: string): Promise<string>;
}
