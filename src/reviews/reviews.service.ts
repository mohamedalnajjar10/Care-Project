import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { CareSearchIndexer } from '../search/indexes/care-search.indexer';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly careSearchIndexer: CareSearchIndexer,
  ) { }

  /**
   * Create or update review
   */
  async createOrUpdateReview(patientId: string, dto: CreateReviewDto) {
    // Validate doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorProfileId },
      include: { user: true },
    });

    if (!doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Check if patient has appointment with this doctor
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        doctorProfileId: dto.doctorProfileId,
        status: 'COMPLETED',
      },
    });

    if (!appointment) {
      throw new BadRequestException(
        'You must have a completed appointment with this doctor to leave a review',
      );
    }

    // Check if review already exists
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
      // Update existing review
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
    } else {
      // Create new review
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

    // Recalculate doctor's rating
    await this.recalculateDoctorRating(dto.doctorProfileId);

    // Send notification to doctor
    await this.notificationsService.createNotification({
      userId: doctorProfile.userId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'New Review Received',
      message: `${review.patient.fullName} has ${existingReview ? 'updated their' : 'left a'} review: ${dto.rating} stars`,
      data: {
        reviewId: review.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    // Update search index
    await this.careSearchIndexer.upsertDoctorProfile(dto.doctorProfileId);

    return review;
  }

  /**
   * Recalculate doctor's average rating
   */
  private async recalculateDoctorRating(doctorProfileId: string) {
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
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewsCount: reviews.length,
      },
    });

    this.logger.log(
      `Doctor rating updated: ${doctorProfileId}, avg: ${averageRating}, count: ${reviews.length}`,
    );
  }

  /**
   * Get reviews for a doctor
   */
  async getDoctorReviews(doctorProfileId: string, page: number = 1, limit: number = 10) {
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

  /**
   * Get patient's reviews
   */
  async getPatientReviews(patientId: string) {
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

  /**
   * Delete review
   */
  async deleteReview(patientId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.patientId !== patientId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate rating
    await this.recalculateDoctorRating(review.doctorProfileId);

    // Update search index
    await this.careSearchIndexer.upsertDoctorProfile(review.doctorProfileId);

    this.logger.log(`Review deleted: ${reviewId}`);

    return { message: 'Review deleted successfully' };
  }
}