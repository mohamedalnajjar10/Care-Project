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
exports.CareSearchIndexer = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const meili_service_1 = require("../meili/meili.service");
const care_search_mapper_1 = require("./care-search.mapper");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let CareSearchIndexer = class CareSearchIndexer {
    prisma;
    meili;
    constructor(prisma, meili) {
        this.prisma = prisma;
        this.meili = meili;
    }
    async onModuleInit() {
        await this.ensureSettings();
    }
    async ensureSettings() {
        const index = this.meili.getIndex();
        await index.updateSettings({
            searchableAttributes: ['title', 'subtitle', 'tags'],
            filterableAttributes: ['type', 'specialtyId'],
            sortableAttributes: ['createdAt', 'rating', 'experience'],
            rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        });
        await sleep(2000);
    }
    async reindexAll() {
        const index = this.meili.getIndex();
        const [doctors, specialties] = await Promise.all([
            this.prisma.doctorProfile.findMany({
                include: {
                    user: { select: { id: true, fullName: true } },
                    specialty: { select: { id: true, name: true } },
                },
            }),
            this.prisma.specialty.findMany(),
        ]);
        const documents = [
            ...doctors.map(care_search_mapper_1.CareSearchMapper.doctorToDocument),
            ...specialties.map(care_search_mapper_1.CareSearchMapper.specialtyToDocument),
        ];
        console.log(`Sending ${documents.length} documents to Meilisearch...`);
        await index.deleteAllDocuments();
        await index.addDocuments(documents);
        console.log('Waiting for indexing to process...');
        await sleep(3000);
        console.log('Indexing wait finished.');
    }
    async upsertDoctorProfile(doctorProfileId) {
        const index = this.meili.getIndex();
        const doctor = await this.prisma.doctorProfile.findUnique({
            where: { id: doctorProfileId },
            include: {
                user: { select: { id: true, fullName: true } },
                specialty: { select: { id: true, name: true } },
            },
        });
        if (!doctor)
            return;
        await index.addDocuments([care_search_mapper_1.CareSearchMapper.doctorToDocument(doctor)]);
    }
    async deleteDoctorProfile(doctorProfileId) {
        const index = this.meili.getIndex();
        await index.deleteDocument(`doctor_${doctorProfileId}`);
    }
    async upsertSpecialty(specialtyId) {
        const index = this.meili.getIndex();
        const specialty = await this.prisma.specialty.findUnique({ where: { id: specialtyId } });
        if (!specialty)
            return;
        await index.addDocuments([care_search_mapper_1.CareSearchMapper.specialtyToDocument(specialty)]);
    }
    async deleteSpecialty(specialtyId) {
        const index = this.meili.getIndex();
        await index.deleteDocument(`specialty_${specialtyId}`);
    }
};
exports.CareSearchIndexer = CareSearchIndexer;
exports.CareSearchIndexer = CareSearchIndexer = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        meili_service_1.MeiliService])
], CareSearchIndexer);
//# sourceMappingURL=care-search.indexer.js.map