import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Create or update review (patients only)' })
  createOrUpdateReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    const patientId = req.user.id || req.user.sub;
    return this.reviewsService.createOrUpdateReview(patientId, dto);
  }

  @Get('doctor/:doctorProfileId')
  @ApiOperation({ summary: 'Get reviews for a doctor' })
  getDoctorReviews(
    @Param('doctorProfileId') doctorProfileId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getDoctorReviews(doctorProfileId, page, limit);
  }

  @Get('my-reviews')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Get my reviews (patient)' })
  getMyReviews(@Req() req: any) {
    const patientId = req.user.id || req.user.sub;
    return this.reviewsService.getPatientReviews(patientId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Delete review' })
  deleteReview(@Req() req: any, @Param('id') id: string) {
    const patientId = req.user.id || req.user.sub;
    return this.reviewsService.deleteReview(patientId, id);
  }
}