"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDispensaryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_dispensary_dto_1 = require("./create-dispensary.dto");
class UpdateDispensaryDto extends (0, mapped_types_1.PartialType)(create_dispensary_dto_1.CreateDispensaryDto) {
}
exports.UpdateDispensaryDto = UpdateDispensaryDto;
//# sourceMappingURL=update-dispensary.dto.js.map