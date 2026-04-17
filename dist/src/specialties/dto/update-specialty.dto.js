"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSpecialtyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_specialty_dto_1 = require("./create-specialty.dto");
class UpdateSpecialtyDto extends (0, swagger_1.PartialType)(create_specialty_dto_1.CreateSpecialtyDto) {
}
exports.UpdateSpecialtyDto = UpdateSpecialtyDto;
//# sourceMappingURL=update-specialty.dto.js.map