import { DoctorsService } from './doctors.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
export declare class DoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    createMyProfile(req: any, dto: CreateDoctorProfileDto): Promise<{
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
    searchDoctors(req: any, query: SearchDoctorsDto): Promise<{
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
    getMyFavorites(req: any): Promise<{
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
    toggleFavorite(req: any, doctorProfileId: string): Promise<{
        message: string;
        isFavorite: boolean;
    }>;
    syncDoctors(): Promise<{
        message: string;
        totalDocuments: number;
    }>;
}
