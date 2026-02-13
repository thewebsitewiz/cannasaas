"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
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
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map