"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const crypto = require("crypto");
const path = require("path");
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
let UploadService = class UploadService {
    constructor(configService) {
        this.configService = configService;
        const region = this.configService.get('aws.region');
        const accessKeyId = this.configService.get('aws.accessKeyId');
        const secretAccessKey = this.configService.get('aws.secretAccessKey');
        const bucketName = this.configService.get('aws.s3BucketName');
        const cloudFrontDomain = this.configService.get('aws.cloudFrontDomain') || '';
        if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
            console.warn('⚠️  AWS configuration is incomplete - file uploads will be disabled');
            return;
        }
        this.s3Client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.bucketName = bucketName;
        this.cloudFrontDomain = cloudFrontDomain;
    }
    async uploadFile(file, folder = 'uploads') {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${crypto.randomUUID()}${fileExtension}`;
        const key = `${folder}/${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });
        await this.s3Client.send(command);
        return `https://${this.cloudFrontDomain}/${key}`;
    }
    async uploadLogo(file, dispensaryId) {
        return this.uploadFile(file, `logos/${dispensaryId}`);
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], UploadService);
//# sourceMappingURL=upload.service.js.map