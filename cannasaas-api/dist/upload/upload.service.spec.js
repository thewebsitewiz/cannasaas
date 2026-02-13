"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const upload_service_1 = require("./upload.service");
describe('UploadService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [upload_service_1.UploadService],
        }).compile();
        service = module.get(upload_service_1.UploadService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=upload.service.spec.js.map