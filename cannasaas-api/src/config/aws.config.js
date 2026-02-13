"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function () { return ({
    // ... existing config ...
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3BucketName: process.env.AWS_S3_BUCKET_NAME,
        cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN || '',
    },
}); });
