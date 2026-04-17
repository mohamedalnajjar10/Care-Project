import { PrismaService } from 'prisma/prisma.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { CareSearchService } from 'src/search/indexes/care-search.service';
import { CareSearchIndexer } from 'src/search/indexes/care-search.indexer';
import { MeiliService } from 'src/search/meili/meili.service';
export declare class DoctorsService {
    private readonly prisma;
    private readonly careSearch;
    private readonly careSearchIndexer;
    private readonly meili;
    private readonly logger;
    constructor(prisma: PrismaService, careSearch: CareSearchService, careSearchIndexer: CareSearchIndexer, meili: MeiliService);
    createProfileForDoctor(userId: string, dto: CreateDoctorProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        specialtyId: string;
        hospitalName: string;
        workingHours: string;
        experience: number;
        consultationFee: import("@prisma/client/runtime/library").Decimal;
        about: string | null;
        rating: number;
        reviewsCount: number;
    }>;
    searchDoctors(currentUserId: string, query: SearchDoctorsDto): Promise<{
        data: ({
            type: string;
            id: string;
            userId: string;
            fullName: string;
            avatar: string | null;
            specialty: string;
            specialtyId: string;
            hospitalName: string;
            rating: number;
            isFavorite: boolean;
            name?: undefined;
            iconUrl?: undefined;
        } | {
            type: string;
            id: string;
            name: string;
            iconUrl: string | null;
            userId?: undefined;
            fullName?: undefined;
            avatar?: undefined;
            specialty?: undefined;
            specialtyId?: undefined;
            hospitalName?: undefined;
            rating?: undefined;
            isFavorite?: undefined;
        } | null)[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    syncAllDoctorsToSearch(): Promise<{
        message: string;
        totalDocuments: number;
    }>;
    toggleFavorite(userId: string, doctorProfileId: string): Promise<{
        message: string;
        isFavorite: boolean;
    }>;
    getFavorites(userId: string): Promise<{
        id: string;
        fullName: string;
        avatar: string | null;
        specialty: string;
        specialtyIcon: string | null;
        hospitalName: string;
        rating: number;
        reviewsCount: number;
        isFavorite: boolean;
        addedAt: Date;
    }[]>;
}
