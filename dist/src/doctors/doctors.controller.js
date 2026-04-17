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
exports.DoctorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const doctors_service_1 = require("./doctors.service");
const create_doctor_profile_dto_1 = require("./dto/create-doctor-profile.dto");
const search_doctors_dto_1 = require("./dto/search-doctors.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let DoctorsController = class DoctorsController {
    doctorsService;
    constructor(doctorsService) {
        this.doctorsService = doctorsService;
    }
    createMyProfile(req, dto) {
        const userId = req.user.id || req.user.sub;
        return this.doctorsService.createProfileForDoctor(userId, dto);
    }
    searchDoctors(req, query) {
        const userId = req.user.id || req.user.sub;
        return this.doctorsService.searchDoctors(userId, query);
    }
    async getMyFavorites(req) {
        return this.doctorsService.getFavorites(req.user.id);
    }
    async toggleFavorite(req, doctorProfileId) {
        return this.doctorsService.toggleFavorite(req.user.id, doctorProfileId);
    }
    async syncDoctors() {
        return this.doctorsService.syncAllDoctorsToSearch();
    }
};
exports.DoctorsController = DoctorsController;
__decorate([
    (0, common_1.Post)('profile'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create medical profile (doctors only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_doctor_profile_dto_1.CreateDoctorProfileDto]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "createMyProfile", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search, filter, and sort doctors and specialties' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, search_doctors_dto_1.SearchDoctorsDto]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "searchDoctors", null);
__decorate([
    (0, common_1.Get)('favorites'),
    (0, swagger_1.ApiOperation)({ summary: 'List favorite doctors' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DoctorsController.prototype, "getMyFavorites", null);
__decorate([
    (0, common_1.Post)('favorite/:doctorProfileId/toggle'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Add or remove doctor from favorites (patients only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('doctorProfileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DoctorsController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync doctors and specialties to search index (manual run)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DoctorsController.prototype, "syncDoctors", null);
exports.DoctorsController = DoctorsController = __decorate([
    (0, swagger_1.ApiTags)('Doctors & Favorites'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('doctors'),
    __metadata("design:paramtypes", [doctors_service_1.DoctorsService])
], DoctorsController);
//# sourceMappingURL=doctors.controller.js.map