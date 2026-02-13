"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const compliance_service_1 = require("./compliance.service");
describe('ComplianceService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [compliance_service_1.ComplianceService],
        }).compile();
        service = module.get(compliance_service_1.ComplianceService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=compliance.service.spec.js.map