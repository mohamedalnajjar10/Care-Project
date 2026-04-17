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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByMobile(mobile, currentUserId, currentUserRole) {
        const user = await this.prisma.user.findUnique({
            where: { mobile },
        });
        if (!currentUserId && !currentUserRole) {
            return user;
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found with this mobile number');
        }
        if (currentUserRole !== client_1.UserRole.ADMIN && user.id !== currentUserId) {
            throw new common_1.ForbiddenException('You can only view your own profile');
        }
        return user;
    }
    async findById(id, currentUserId, currentUserRole) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!currentUserId && !currentUserRole) {
            return user;
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found in the system');
        }
        if (currentUserRole !== client_1.UserRole.ADMIN && user.id !== currentUserId) {
            throw new common_1.ForbiddenException('You can only view your own profile');
        }
        return user;
    }
    async findByEmail(email) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findByGoogleId(googleId) {
        return await this.prisma.user.findUnique({
            where: { googleId },
        });
    }
    async create(data) {
        try {
            return await this.prisma.user.create({
                data: {
                    fullName: data.fullName,
                    mobile: data.mobile,
                    email: data.email,
                    role: data.role || client_1.UserRole.PATIENT,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('Phone number or email is already registered');
            }
            throw new common_1.InternalServerErrorException('An error occurred while creating the user');
        }
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);
        return {
            totalPages: Math.ceil(total / limit),
            total,
            page,
            limit,
            data,
        };
    }
    async update(id, data, currentUserId, currentUserRole) {
        const user = await this.findById(id, currentUserId, currentUserRole);
        if (!user) {
            throw new common_1.NotFoundException('User not found in the system');
        }
        try {
            return await this.prisma.user.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('Phone number or email is already registered');
            }
            throw new common_1.InternalServerErrorException('An error occurred while updating the user');
        }
    }
    async remove(id, currentUserId, currentUserRole) {
        const user = await this.findById(id, currentUserId, currentUserRole);
        if (!user) {
            throw new common_1.NotFoundException('User not found in the system');
        }
        await this.prisma.user.delete({
            where: { id },
        });
        return {
            message: 'User deleted successfully'
        };
    }
    async updateVerified(userId) {
        return await this.prisma.user.update({
            where: { id: userId },
            data: {
                isVerified: true,
            },
        });
    }
    async updateLastLogin(userId) {
        return await this.prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=user.service.js.map