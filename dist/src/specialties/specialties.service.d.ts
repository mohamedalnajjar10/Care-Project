import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { PrismaService } from 'prisma/prisma.service';
export declare class SpecialtiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSpecialtyDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        iconUrl: string | null;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        data: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            iconUrl: string | null;
        }[];
    }>;
    update(id: string, dto: UpdateSpecialtyDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        iconUrl: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
