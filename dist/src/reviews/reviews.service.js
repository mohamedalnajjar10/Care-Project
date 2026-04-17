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
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const care_search_indexer_1 = require("../search/indexes/care-search.indexer");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    prisma;
    notificationsService;
    careSearchIndexer;
    logger = new common_1.Logger(ReviewsService_1.name);
    constructor(prisma, notificationsService, careSearchIndexer) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.careSearchIndexer = careSearchIndexer;
    }
    async createOrUpdateReview(patientId, dto) {
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
            where: { id: dto.doctorProfileId },
            include: { user: true },
        });
        if (!doctorProfile) {
            throw new common_1.NotFoundException('Doctor profile not found');
        }
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                patientId,
                doctorProfileId: dto.doctorProfileId,
                status: 'COMPLETED',
            },
        });
        if (!appointment) {
            throw new common_1.BadRequestException('You must have a completed appointment with this doctor to leave a review');
        }
        const existingReview = await this.prisma.review.findUnique({
            where: {
                patientId_doctorProfileId: {
                    patientId,
                    doctorProfileId: dto.doctorProfileId,
                },
            },
        });
        let review;
        if (existingReview) {
            review = await this.prisma.review.update({
                where: { id: existingReview.id },
                data: {
                    rating: dto.rating,
                    comment: dto.comment,
                },
                include: {
                    patient: true,
                },
            });
            this.logger.log(`Review updated: ${review.id}`);
        }
        else {
            review = await this.prisma.review.create({
                data: {
                    patientId,
                    doctorProfileId: dto.doctorProfileId,
                    rating: dto.rating,
                    comment: dto.comment,
                },
                include: {
                    patient: true,
                },
            });
            this.logger.log(`Review created: ${review.id}`);
        }
        await this.recalculateDoctorRating(dto.doctorProfileId);
        await this.notificationsService.createNotification({
            userId: doctorProfile.userId,
            type: client_1.NotificationType.REVIEW_RECEIVED,
            title: 'New Review Received',
            message: `${review.patient.fullName} has ${existingReview ? 'updated their' : 'left a'} review: ${dto.rating} stars`,
            data: {
                reviewId: review.id,
                rating: dto.rating,
                comment: dto.comment,
            },
        });
        await this.careSearchIndexer.upsertDoctorProfile(dto.doctorProfileId);
        return review;
    }
    async recalculateDoctorRating(doctorProfileId) {
        const reviews = await this.prisma.review.findMany({
            where: { doctorProfileId },
            select: { rating: true },
        });
        if (reviews.length === 0) {
            await this.prisma.doctorProfile.update({
                where: { id: doctorProfileId },
                data: { rating: 0, reviewsCount: 0 },
            });
            return;
        }
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        await this.prisma.doctorProfile.update({
            where: { id: doctorProfileId },
            data: {
                rating: Math.round(averageRating * 10) / 10,
                reviewsCount: reviews.length,
            },
        });
        this.logger.log(`Doctor rating updated: ${doctorProfileId}, avg: ${averageRating}, count: ${reviews.length}`);
    }
    async getDoctorReviews(doctorProfileId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { doctorProfileId },
                include: {
                    patient: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count({ where: { doctorProfileId } }),
        ]);
        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getPatientReviews(patientId) {
        return this.prisma.review.findMany({
            where: { patientId },
            include: {
                doctorProfile: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                avatar: true,
                            },
                        },
                        specialty: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteReview(patientId, reviewId) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.patientId !== patientId) {
            throw new common_1.BadRequestException('You can only delete your own reviews');
        }
        await this.prisma.review.delete({
            where: { id: reviewId },
        });
        await this.recalculateDoctorRating(review.doctorProfileId);
        await this.careSearchIndexer.upsertDoctorProfile(review.doctorProfileId);
        this.logger.log(`Review deleted: ${reviewId}`);
        return { message: 'Review deleted successfully' };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        care_search_indexer_1.CareSearchIndexer])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map