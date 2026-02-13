"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const compliance_controller_1 = require("./compliance.controller");
describe('ComplianceController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [compliance_controller_1.ComplianceController],
        }).compile();
        controller = module.get(compliance_controller_1.ComplianceController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=compliance.controller.spec.js.map