"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const organizations_controller_1 = require("./organizations.controller");
describe('OrganizationsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [organizations_controller_1.OrganizationsController],
        }).compile();
        controller = module.get(organizations_controller_1.OrganizationsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=organizations.controller.spec.js.map