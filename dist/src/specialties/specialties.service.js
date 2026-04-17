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
exports.SpecialtiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SpecialtiesService = class SpecialtiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.specialty.findUnique({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException('The specialization already exists');
        return this.prisma.specialty.create({ data: dto });
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.specialty.findMany({
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.specialty.count(),
        ]);
        return {
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data,
        };
    }
    async update(id, dto) {
        const specialty = await this.prisma.specialty.findUnique({ where: { id } });
        if (!specialty)
            throw new common_1.NotFoundException('The specialization does not exist');
        return this.prisma.specialty.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const specialty = await this.prisma.specialty.findUnique({ where: { id } });
        if (!specialty)
            throw new common_1.NotFoundException('The specialization does not exist');
        await this.prisma.specialty.delete({ where: { id } });
        return { message: 'The specialization has been deleted successfully' };
    }
};
exports.SpecialtiesService = SpecialtiesService;
exports.SpecialtiesService = SpecialtiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpecialtiesService);
//# sourceMappingURL=specialties.service.js.map