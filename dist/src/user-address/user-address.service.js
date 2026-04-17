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
exports.UserAddressService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const maps_service_1 = require("../maps/maps.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let UserAddressService = class UserAddressService {
    prisma;
    mapsService;
    constructor(prisma, mapsService) {
        this.prisma = prisma;
        this.mapsService = mapsService;
    }
    async create(userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const shouldSetAsDefault = await this.shouldSetAsDefault(userId, dto.isDefault);
            if (shouldSetAsDefault) {
                await this.clearDefaultAddress(tx, userId);
            }
            return tx.userAddress.create({
                data: {
                    userId,
                    label: dto.label,
                    title: dto.title,
                    formattedAddress: dto.formattedAddress,
                    placeId: dto.placeId,
                    latitude: this.toDecimal(dto.latitude),
                    longitude: this.toDecimal(dto.longitude),
                    street: dto.street,
                    area: dto.area,
                    city: dto.city,
                    state: dto.state,
                    country: dto.country,
                    postalCode: dto.postalCode,
                    buildingNumber: dto.buildingNumber,
                    floor: dto.floor,
                    apartmentNumber: dto.apartmentNumber,
                    landmark: dto.landmark,
                    notes: dto.notes,
                    isDefault: shouldSetAsDefault,
                },
            });
        });
    }
    async createFromMap(userId, dto) {
        const resolvedAddress = await this.mapsService.reverseGeocode(dto.latitude, dto.longitude);
        return this.prisma.$transaction(async (tx) => {
            const shouldSetAsDefault = await this.shouldSetAsDefault(userId, dto.isDefault);
            if (shouldSetAsDefault) {
                await this.clearDefaultAddress(tx, userId);
            }
            return tx.userAddress.create({
                data: {
                    userId,
                    label: dto.label,
                    title: dto.title,
                    formattedAddress: resolvedAddress.formattedAddress,
                    placeId: resolvedAddress.placeId,
                    latitude: this.toDecimal(dto.latitude),
                    longitude: this.toDecimal(dto.longitude),
                    street: resolvedAddress.street,
                    area: resolvedAddress.area,
                    city: resolvedAddress.city,
                    state: resolvedAddress.state,
                    country: resolvedAddress.country,
                    postalCode: resolvedAddress.postalCode,
                    landmark: dto.landmark,
                    notes: dto.notes,
                    isDefault: shouldSetAsDefault,
                },
            });
        });
    }
    async findAllByUser(userId) {
        return this.prisma.userAddress.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async findDefaultByUser(userId) {
        return this.prisma.userAddress.findFirst({
            where: {
                userId,
                isDefault: true,
            },
        });
    }
    async findOneById(userId, addressId) {
        const address = await this.prisma.userAddress.findFirst({
            where: {
                id: addressId,
                userId,
            },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        return address;
    }
    async update(userId, addressId, dto) {
        await this.ensureAddressOwnership(userId, addressId);
        return this.prisma.$transaction(async (tx) => {
            const shouldSetAsDefault = dto.isDefault === true;
            if (shouldSetAsDefault) {
                await this.clearDefaultAddress(tx, userId);
            }
            return tx.userAddress.update({
                where: { id: addressId },
                data: {
                    ...(dto.label !== undefined && { label: dto.label }),
                    ...(dto.title !== undefined && { title: dto.title }),
                    ...(dto.formattedAddress !== undefined && {
                        formattedAddress: dto.formattedAddress,
                    }),
                    ...(dto.placeId !== undefined && { placeId: dto.placeId }),
                    ...(dto.latitude !== undefined && {
                        latitude: this.toDecimal(dto.latitude),
                    }),
                    ...(dto.longitude !== undefined && {
                        longitude: this.toDecimal(dto.longitude),
                    }),
                    ...(dto.street !== undefined && { street: dto.street }),
                    ...(dto.area !== undefined && { area: dto.area }),
                    ...(dto.city !== undefined && { city: dto.city }),
                    ...(dto.state !== undefined && { state: dto.state }),
                    ...(dto.country !== undefined && { country: dto.country }),
                    ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
                    ...(dto.buildingNumber !== undefined && {
                        buildingNumber: dto.buildingNumber,
                    }),
                    ...(dto.floor !== undefined && { floor: dto.floor }),
                    ...(dto.apartmentNumber !== undefined && {
                        apartmentNumber: dto.apartmentNumber,
                    }),
                    ...(dto.landmark !== undefined && { landmark: dto.landmark }),
                    ...(dto.notes !== undefined && { notes: dto.notes }),
                    ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
                },
            });
        });
    }
    async remove(userId, addressId) {
        const address = await this.findOneById(userId, addressId);
        await this.prisma.$transaction(async (tx) => {
            await tx.userAddress.delete({
                where: { id: address.id },
            });
            if (address.isDefault) {
                const latestAddress = await tx.userAddress.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                });
                if (latestAddress) {
                    await tx.userAddress.update({
                        where: { id: latestAddress.id },
                        data: { isDefault: true },
                    });
                }
            }
        });
    }
    async setDefault(userId, addressId) {
        await this.ensureAddressOwnership(userId, addressId);
        return this.prisma.$transaction(async (tx) => {
            await this.clearDefaultAddress(tx, userId);
            return tx.userAddress.update({
                where: { id: addressId },
                data: { isDefault: true },
            });
        });
    }
    async ensureAddressOwnership(userId, addressId) {
        const address = await this.prisma.userAddress.findFirst({
            where: {
                id: addressId,
                userId,
            },
            select: { id: true },
        });
        if (!address) {
            throw new common_1.ForbiddenException('You do not have access to this address');
        }
    }
    async shouldSetAsDefault(userId, requestedDefault) {
        if (requestedDefault) {
            return true;
        }
        const existingCount = await this.prisma.userAddress.count({
            where: { userId },
        });
        return existingCount === 0;
    }
    async clearDefaultAddress(tx, userId) {
        await tx.userAddress.updateMany({
            where: {
                userId,
                isDefault: true,
            },
            data: {
                isDefault: false,
            },
        });
    }
    toDecimal(value) {
        return new client_1.Prisma.Decimal(value);
    }
};
exports.UserAddressService = UserAddressService;
exports.UserAddressService = UserAddressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        maps_service_1.MapsService])
], UserAddressService);
//# sourceMappingURL=user-address.service.js.map