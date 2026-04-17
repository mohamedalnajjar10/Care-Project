import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MeiliService } from '../meili/meili.service';
export declare class CareSearchIndexer implements OnModuleInit {
    private readonly prisma;
    private readonly meili;
    constructor(prisma: PrismaService, meili: MeiliService);
    onModuleInit(): Promise<void>;
    ensureSettings(): Promise<void>;
    reindexAll(): Promise<void>;
    upsertDoctorProfile(doctorProfileId: string): Promise<void>;
    deleteDoctorProfile(doctorProfileId: string): Promise<void>;
    upsertSpecialty(specialtyId: string): Promise<void>;
    deleteSpecialty(specialtyId: string): Promise<void>;
}
