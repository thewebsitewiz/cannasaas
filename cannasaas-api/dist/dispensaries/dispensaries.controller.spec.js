"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const dispensaries_controller_1 = require("./dispensaries.controller");
describe('DispensariesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [dispensaries_controller_1.DispensariesController],
        }).compile();
        controller = module.get(dispensaries_controller_1.DispensariesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=dispensaries.controller.spec.js.map