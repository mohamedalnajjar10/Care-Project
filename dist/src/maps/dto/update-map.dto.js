"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMapDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_map_dto_1 = require("./create-map.dto");
class UpdateMapDto extends (0, swagger_1.PartialType)(create_map_dto_1.CreateMapDto) {
}
exports.UpdateMapDto = UpdateMapDto;
//# sourceMappingURL=update-map.dto.js.map