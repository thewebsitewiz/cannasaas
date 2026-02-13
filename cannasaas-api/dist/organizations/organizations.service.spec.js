"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const organizations_service_1 = require("./organizations.service");
describe('OrganizationsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [organizations_service_1.OrganizationsService],
        }).compile();
        service = module.get(organizations_service_1.OrganizationsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=organizations.service.spec.js.map