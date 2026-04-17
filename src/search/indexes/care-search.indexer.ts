import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MeiliService } from '../meili/meili.service';
import { CareSearchMapper } from './care-search.mapper';

// Helper to wait (timing workaround)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

@Injectable()
export class CareSearchIndexer implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly meili: MeiliService,
    ) { }

    async onModuleInit() {
        await this.ensureSettings();
    }

    async ensureSettings(): Promise<void> {
        const index = this.meili.getIndex();
        await index.updateSettings({
            searchableAttributes: ['title', 'subtitle', 'tags'],
            filterableAttributes: ['type', 'specialtyId'],
            sortableAttributes: ['createdAt', 'rating', 'experience'],
            rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        });
        // Wait 2s so settings apply
        await sleep(2000);
    }

    async reindexAll(): Promise<void> {
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
            ...doctors.map(CareSearchMapper.doctorToDocument),
            ...specialties.map(CareSearchMapper.specialtyToDocument),
        ];

        console.log(`Sending ${documents.length} documents to Meilisearch...`);

        await index.deleteAllDocuments();
        await index.addDocuments(documents);

        // Wait 3s before returning so indexing can settle
        console.log('Waiting for indexing to process...');
        await sleep(3000);
        console.log('Indexing wait finished.');
    }

    async upsertDoctorProfile(doctorProfileId: string): Promise<void> {
        const index = this.meili.getIndex();
        const doctor = await this.prisma.doctorProfile.findUnique({
            where: { id: doctorProfileId },
            include: {
                user: { select: { id: true, fullName: true } },
                specialty: { select: { id: true, name: true } },
            },
        });

        if (!doctor) return;
        await index.addDocuments([CareSearchMapper.doctorToDocument(doctor)]);
    }

    async deleteDoctorProfile(doctorProfileId: string): Promise<void> {
        const index = this.meili.getIndex();
        await index.deleteDocument(`doctor_${doctorProfileId}`);
    }

    async upsertSpecialty(specialtyId: string): Promise<void> {
        const index = this.meili.getIndex();
        const specialty = await this.prisma.specialty.findUnique({ where: { id: specialtyId } });
        if (!specialty) return;
        await index.addDocuments([CareSearchMapper.specialtyToDocument(specialty)]);
    }

    async deleteSpecialty(specialtyId: string): Promise<void> {
        const index = this.meili.getIndex();
        await index.deleteDocument(`specialty_${specialtyId}`);
    }
}