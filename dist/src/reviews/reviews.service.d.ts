import { PrismaService } from 'prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { CareSearchIndexer } from '../search/indexes/care-search.indexer';
export declare class ReviewsService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly careSearchIndexer;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, careSearchIndexer: CareSearchIndexer);
    createOrUpdateReview(patientId: string, dto: CreateReviewDto): Promise<any>;
    private recalculateDoctorRating;
    getDoctorReviews(doctorProfileId: string, page?: number, limit?: number): Promise<{
        data: ({
            patient: {
                fullName: string;
                id: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            doctorProfileId: string;
            patientId: string;
            comment: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPatientReviews(patientId: string): Promise<({
        doctorProfile: {
            user: {
                fullName: string;
                id: string;
                avatar: string | null;
            };
            specialty: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                iconUrl: string | null;
            };
        } & {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        doctorProfileId: string;
        patientId: string;
        comment: string | null;
    })[]>;
    deleteReview(patientId: string, reviewId: string): Promise<{
        message: string;
    }>;
}
