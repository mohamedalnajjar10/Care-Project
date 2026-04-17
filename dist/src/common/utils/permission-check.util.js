"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermissions = RequirePermissions;
exports.AdminOnly = AdminOnly;
exports.DoctorOnly = DoctorOnly;
exports.DoctorOrAdmin = DoctorOrAdmin;
exports.AuthenticatedOnly = AuthenticatedOnly;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const role_enum_1 = require("../enums/role.enum");
const roles_decorator_1 = require("../decorators/roles.decorator");
const roles_guard_1 = require("../guards/roles.guard");
function RequirePermissions(...roles) {
    return (0, common_1.applyDecorators)((0, roles_decorator_1.Roles)(...roles), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing token.'
    }), (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Insufficient permissions.'
    }));
}
function AdminOnly() {
    return RequirePermissions(role_enum_1.Role.ADMIN);
}
function DoctorOnly() {
    return RequirePermissions(role_enum_1.Role.DOCTOR);
}
function DoctorOrAdmin() {
    return RequirePermissions(role_enum_1.Role.DOCTOR, role_enum_1.Role.ADMIN);
}
function AuthenticatedOnly() {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing token.'
    }));
}
//# sourceMappingURL=permission-check.util.js.map