"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAddressDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_user_address_dto_1 = require("./create-user-address.dto");
class UpdateAddressDto extends (0, swagger_1.PartialType)(create_user_address_dto_1.CreateUserAddressDto) {
}
exports.UpdateAddressDto = UpdateAddressDto;
//# sourceMappingURL=update-user-address.dto.js.map