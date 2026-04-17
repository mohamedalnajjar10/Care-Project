import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createOrUpdateReview(req: any, dto: CreateReviewDto): Promise<any>;
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
    getMyReviews(req: any): Promise<({
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
    deleteReview(req: any, id: string): Promise<{
        message: string;
    }>;
}
