import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
export declare class SpecialtiesController {
    private readonly specialtiesService;
    constructor(specialtiesService: SpecialtiesService);
    findAll(page?: string, limit?: string): Promise<{
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
    create(createSpecialtyDto: CreateSpecialtyDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        iconUrl: string | null;
    }>;
    update(id: string, updateSpecialtyDto: UpdateSpecialtyDto): Promise<{
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
