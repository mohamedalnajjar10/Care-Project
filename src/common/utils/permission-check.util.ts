import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Role } from '../enums/role.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';




export function RequirePermissions(...roles: Role[]) {
    return applyDecorators(
        Roles(...roles),
        UseGuards(JwtAuthGuard, RolesGuard),
        ApiBearerAuth(),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing token.'
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - Insufficient permissions.'
        }),
    );
}

export function AdminOnly() {
    return RequirePermissions(Role.ADMIN);
}


export function DoctorOnly() {
    return RequirePermissions(Role.DOCTOR);
}


export function DoctorOrAdmin() {
    return RequirePermissions(Role.DOCTOR, Role.ADMIN);
}

export function AuthenticatedOnly() {
    return applyDecorators(
        UseGuards(JwtAuthGuard),
        ApiBearerAuth(),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing token.'
        }),
    );
}
