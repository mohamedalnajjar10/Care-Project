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
var DoctorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const care_search_service_1 = require("../search/indexes/care-search.service");
const care_search_indexer_1 = require("../search/indexes/care-search.indexer");
const meili_service_1 = require("../search/meili/meili.service");
const care_search_mapper_1 = require("../search/indexes/care-search.mapper");
let DoctorsService = DoctorsService_1 = class DoctorsService {
    prisma;
    careSearch;
    careSearchIndexer;
    meili;
    logger = new common_1.Logger(DoctorsService_1.name);
    constructor(prisma, careSearch, careSearchIndexer, meili) {
        this.prisma = prisma;
        this.careSearch = careSearch;
        this.careSearchIndexer = careSearchIndexer;
        this.meili = meili;
    }
    async createProfileForDoctor(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role !== client_1.UserRole.DOCTOR) {
            throw new common_1.ForbiddenException('Only a doctor can create a medical profile');
        }
        const existingProfile = await this.prisma.doctorProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (existingProfile) {
            throw new common_1.ConflictException('You already have a medical profile');
        }
        const specialtyExists = await this.prisma.specialty.findUnique({
            where: { id: dto.specialtyId },
            select: { id: true },
        });
        if (!specialtyExists)
            throw new common_1.BadRequestException('Specialty not found');
        try {
            const profile = await this.prisma.doctorProfile.create({
                data: {
                    userId,
                    specialtyId: dto.specialtyId,
                    hospitalName: dto.hospitalName,
                    workingHours: dto.workingHours,
                    experience: dto.experience ?? 0,
                    consultationFee: dto.consultationFee,
                    about: dto.about,
                },
            });
            await this.careSearchIndexer.upsertDoctorProfile(profile.id);
            return profile;
        }
        catch (e) {
            if (e?.code === 'P2002') {
                throw new common_1.ConflictException('You already have a medical profile');
            }
            throw e;
        }
    }
    async searchDoctors(currentUserId, query) {
        try {
            const page = query.page ?? 1;
            const limit = query.limit ?? 10;
            const term = (query.searchTerm ?? '').trim();
            const { items, total } = await this.careSearch.search({
                term,
                page,
                limit,
                specialtyId: query.specialtyId,
                sortBy: query.sortBy,
                types: ['doctor', 'specialty'],
            });
            const doctorIds = items
                .filter((i) => i.type === 'doctor')
                .map((i) => i.doctorProfileId);
            const specialtyIds = items
                .filter((i) => i.type === 'specialty')
                .map((i) => i.specialtyId);
            const doctors = doctorIds.length
                ? await this.prisma.doctorProfile.findMany({
                    where: { id: { in: doctorIds } },
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                        specialty: { select: { id: true, name: true, iconUrl: true } },
                        favoritedBy: { where: { userId: currentUserId }, select: { id: true } },
                    },
                })
                : [];
            const specialties = specialtyIds.length
                ? await this.prisma.specialty.findMany({
                    where: { id: { in: specialtyIds } },
                })
                : [];
            const doctorsMap = new Map(doctors.map((d) => [d.id, d]));
            const specialtiesMap = new Map(specialties.map((s) => [s.id, s]));
            const orderedData = items.map((item) => {
                if (item.type === 'doctor') {
                    const doc = doctorsMap.get(item.doctorProfileId);
                    if (!doc)
                        return null;
                    return {
                        type: 'doctor',
                        id: doc.id,
                        userId: doc.user?.id,
                        fullName: doc.user?.fullName,
                        avatar: doc.user?.avatar,
                        specialty: doc.specialty?.name,
                        specialtyId: doc.specialty?.id,
                        hospitalName: doc.hospitalName,
                        rating: doc.rating,
                        isFavorite: doc.favoritedBy.length > 0,
                    };
                }
                else if (item.type === 'specialty') {
                    const spec = specialtiesMap.get(item.specialtyId);
                    if (!spec)
                        return null;
                    return {
                        type: 'specialty',
                        id: spec.id,
                        name: spec.name,
                        iconUrl: spec.iconUrl,
                    };
                }
                return null;
            }).filter(Boolean);
            return {
                data: orderedData,
                meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            };
        }
        catch (error) {
            console.error('Error in searchDoctors:', error);
            throw new common_1.InternalServerErrorException('An error occurred while searching');
        }
    }
    async syncAllDoctorsToSearch() {
        console.log('--- SYNCING DOCTORS & SPECIALTIES ---');
        const index = this.meili.getIndex();
        await index.updateSettings({
            searchableAttributes: ['title', 'subtitle', 'tags'],
            filterableAttributes: ['type', 'specialtyId'],
            sortableAttributes: ['createdAt', 'rating', 'experience'],
            rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        });
        const doctors = await this.prisma.doctorProfile.findMany({
            include: {
                user: { select: { id: true, fullName: true } },
                specialty: { select: { id: true, name: true } },
            },
        });
        const specialties = await this.prisma.specialty.findMany();
        const doctorDocs = doctors.map(care_search_mapper_1.CareSearchMapper.doctorToDocument);
        const specialtyDocs = specialties.map(care_search_mapper_1.CareSearchMapper.specialtyToDocument);
        const allDocuments = [...doctorDocs, ...specialtyDocs];
        console.log(`Sending ${allDocuments.length} documents (Doctors: ${doctorDocs.length}, Specialties: ${specialtyDocs.length})...`);
        await index.addDocuments(allDocuments);
        await new Promise(r => setTimeout(r, 3000));
        const stats = await index.getStats();
        return {
            message: 'Sync Completed',
            totalDocuments: stats.numberOfDocuments,
        };
    }
    async toggleFavorite(userId, doctorProfileId) {
        const doctor = await this.prisma.doctorProfile.findUnique({
            where: { id: doctorProfileId },
            select: { id: true },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor profile not found');
        }
        const existingFavorite = await this.prisma.favoriteDoctor.findUnique({
            where: {
                userId_doctorProfileId: { userId, doctorProfileId },
            },
        });
        if (existingFavorite) {
            await this.prisma.favoriteDoctor.delete({
                where: { id: existingFavorite.id },
            });
            return { message: 'Doctor removed from favorites', isFavorite: false };
        }
        else {
            await this.prisma.favoriteDoctor.create({
                data: { userId, doctorProfileId },
            });
            return { message: 'Doctor added to favorites', isFavorite: true };
        }
    }
    async getFavorites(userId) {
        const favorites = await this.prisma.favoriteDoctor.findMany({
            where: { userId },
            include: {
                doctorProfile: {
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                        specialty: { select: { id: true, name: true, iconUrl: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return favorites.map((fav) => ({
            id: fav.doctorProfile.id,
            fullName: fav.doctorProfile.user.fullName,
            avatar: fav.doctorProfile.user.avatar,
            specialty: fav.doctorProfile.specialty.name,
            specialtyIcon: fav.doctorProfile.specialty.iconUrl,
            hospitalName: fav.doctorProfile.hospitalName,
            rating: fav.doctorProfile.rating,
            reviewsCount: fav.doctorProfile.reviewsCount,
            isFavorite: true,
            addedAt: fav.createdAt,
        }));
    }
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = DoctorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        care_search_service_1.CareSearchService,
        care_search_indexer_1.CareSearchIndexer,
        meili_service_1.MeiliService])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map