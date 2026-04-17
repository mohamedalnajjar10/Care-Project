"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAddressController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_address_from_map_dto_1 = require("./dto/create-address-from-map.dto");
const create_user_address_dto_1 = require("./dto/create-user-address.dto");
const user_address_service_1 = require("./user-address.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const update_user_address_dto_1 = require("./dto/update-user-address.dto");
let UserAddressController = class UserAddressController {
    userAddressService;
    constructor(userAddressService) {
        this.userAddressService = userAddressService;
    }
    async create(req, dto) {
        return this.userAddressService.create(req.user.sub, dto);
    }
    async createFromMap(req, dto) {
        console.log("User from Token:", req.user);
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID is missing from token');
        }
        return this.userAddressService.createFromMap(userId, dto);
    }
    async findAll(req) {
        return this.userAddressService.findAllByUser(req.user.sub);
    }
    async findDefault(req) {
        return this.userAddressService.findDefaultByUser(req.user.sub);
    }
    async findOne(req, id) {
        return this.userAddressService.findOneById(req.user.sub, id);
    }
    async update(req, id, dto) {
        return this.userAddressService.update(req.user.sub, id, dto);
    }
    async setDefault(req, id) {
        return this.userAddressService.setDefault(req.user.sub, id);
    }
    async remove(req, id) {
        await this.userAddressService.remove(req.user.sub, id);
        return {
            message: 'Address deleted successfully',
        };
    }
};
exports.UserAddressController = UserAddressController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new address manually for current user' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_user_address_dto_1.CreateUserAddressDto]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('from-map'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new address from map coordinates' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_address_from_map_dto_1.CreateAddressFromMapDto]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "createFromMap", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all addresses for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('default'),
    (0, swagger_1.ApiOperation)({ summary: 'Get default address for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "findDefault", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get address by id for current user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update address for current user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_user_address_dto_1.UpdateAddressDto]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/default'),
    (0, swagger_1.ApiOperation)({ summary: 'Set address as default' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "setDefault", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete address for current user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserAddressController.prototype, "remove", null);
exports.UserAddressController = UserAddressController = __decorate([
    (0, swagger_1.ApiTags)('User Addresses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('user/addresses'),
    __metadata("design:paramtypes", [user_address_service_1.UserAddressService])
], UserAddressController);
//# sourceMappingURL=user-address.controller.js.map