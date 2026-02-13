"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const dispensaries_service_1 = require("./dispensaries.service");
describe('DispensariesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [dispensaries_service_1.DispensariesService],
        }).compile();
        service = module.get(dispensaries_service_1.DispensariesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=dispensaries.service.spec.js.map