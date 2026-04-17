import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { CareSearchService } from 'src/search/indexes/care-search.service';
import { CareSearchIndexer } from 'src/search/indexes/care-search.indexer';
import { CareSearchDoctorDocument, CareSearchSpecialtyDocument } from 'src/search/indexes/care-search.types';
import { MeiliService } from 'src/search/meili/meili.service';
import { CareSearchMapper } from 'src/search/indexes/care-search.mapper';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly careSearch: CareSearchService,
    private readonly careSearchIndexer: CareSearchIndexer,
    private readonly meili: MeiliService,

  ) { }

  async createProfileForDoctor(userId: string, dto: CreateDoctorProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.DOCTOR) {
      throw new ForbiddenException('Only a doctor can create a medical profile');
    }

    const existingProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existingProfile) {
      throw new ConflictException('You already have a medical profile');
    }

    const specialtyExists = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
      select: { id: true },
    });
    if (!specialtyExists) throw new BadRequestException('Specialty not found');

    try {
      const profile = await this.prisma.doctorProfile.create({
        data: {
          userId,
          specialtyId: dto.specialtyId,
          hospitalName: dto.hospitalName,
          workingHours: dto.workingHours,
          experience: dto.experience ?? 0,
          consultationFee: dto.consultationFee,
          about: dto.about,
        },
      });
      await this.careSearchIndexer.upsertDoctorProfile(profile.id);
      return profile;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('You already have a medical profile');
      }
      throw e;
    }
  }

  async searchDoctors(currentUserId: string, query: SearchDoctorsDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const term = (query.searchTerm ?? '').trim();

      // 1. Search in Meilisearch (no type filter to fetch all)
      const { items, total } = await this.careSearch.search({
        term,
        page,
        limit,
        specialtyId: query.specialtyId,
        sortBy: query.sortBy,
        types: ['doctor', 'specialty'], // search both doctor and specialty
      });

      // 2. Split results by type
      const doctorIds = items
        .filter((i): i is CareSearchDoctorDocument => i.type === 'doctor')
        .map((i) => i.doctorProfileId);

      const specialtyIds = items
        .filter((i): i is CareSearchSpecialtyDocument => i.type === 'specialty')
        .map((i) => i.specialtyId);

      // 3. Load data from Prisma
      // Load doctors
      const doctors = doctorIds.length
        ? await this.prisma.doctorProfile.findMany({
          where: { id: { in: doctorIds } },
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
            specialty: { select: { id: true, name: true, iconUrl: true } },
            favoritedBy: { where: { userId: currentUserId }, select: { id: true } },
          },
        })
        : [];

      // Load specialties
      const specialties = specialtyIds.length
        ? await this.prisma.specialty.findMany({
          where: { id: { in: specialtyIds } },
        })
        : [];

      // 4. Merge results while preserving order
      const doctorsMap = new Map(doctors.map((d) => [d.id, d]));
      const specialtiesMap = new Map(specialties.map((s) => [s.id, s]));

      // Build final result in Meilisearch hit order
      const orderedData = items.map((item) => {
        if (item.type === 'doctor') {
          const doc = doctorsMap.get((item as CareSearchDoctorDocument).doctorProfileId);
          if (!doc) return null;
          return {
            type: 'doctor',
            id: doc.id,
            userId: doc.user?.id,
            fullName: doc.user?.fullName,
            avatar: doc.user?.avatar,
            specialty: doc.specialty?.name,
            specialtyId: doc.specialty?.id,
            hospitalName: doc.hospitalName,
            rating: doc.rating,
            isFavorite: doc.favoritedBy.length > 0,
          };
        } else if (item.type === 'specialty') {
          const spec = specialtiesMap.get((item as CareSearchSpecialtyDocument).specialtyId);
          if (!spec) return null;
          return {
            type: 'specialty',
            id: spec.id,
            name: spec.name,
            iconUrl: spec.iconUrl,
          };
        }
        return null;
      }).filter(Boolean);

      return {
        data: orderedData,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('Error in searchDoctors:', error);
      throw new InternalServerErrorException('An error occurred while searching');
    }
  }

  // async debugMeiliContent() {
  //   const index = this.meili.getIndex();

  //   // Fetch all documents (sample)
  //   const docs = await index.getDocuments({ limit: 10 });

  //   // Fetch stats
  //   const stats = await index.getStats();

  //   return {
  //     message: "Meilisearch Debug Data",
  //     totalDocuments: stats.numberOfDocuments,
  //     sampleDocuments: docs.results,
  //   };
  // }

  async syncAllDoctorsToSearch() {
    console.log('--- SYNCING DOCTORS & SPECIALTIES ---');
    const index = this.meili.getIndex();

    // 1. Update settings (ensure filters exist)
    await index.updateSettings({
      searchableAttributes: ['title', 'subtitle', 'tags'],
      filterableAttributes: ['type', 'specialtyId'],
      sortableAttributes: ['createdAt', 'rating', 'experience'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    // 2. Load doctors
    const doctors = await this.prisma.doctorProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true } },
        specialty: { select: { id: true, name: true } },
      },
    });

    // 3. Load specialties
    const specialties = await this.prisma.specialty.findMany();

    const doctorDocs = doctors.map(CareSearchMapper.doctorToDocument);
    const specialtyDocs = specialties.map(CareSearchMapper.specialtyToDocument);

    // Merge both arrays
    const allDocuments = [...doctorDocs, ...specialtyDocs];

    console.log(`Sending ${allDocuments.length} documents (Doctors: ${doctorDocs.length}, Specialties: ${specialtyDocs.length})...`);

    // 5. Send to index
    await index.addDocuments(allDocuments);

    // Wait then verify
    await new Promise(r => setTimeout(r, 3000));

    const stats = await index.getStats();
    return {
      message: 'Sync Completed',
      totalDocuments: stats.numberOfDocuments,
    };
  }

  async toggleFavorite(userId: string, doctorProfileId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      select: { id: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    const existingFavorite = await this.prisma.favoriteDoctor.findUnique({
      where: {
        userId_doctorProfileId: { userId, doctorProfileId },
      },
    });

    if (existingFavorite) {
      await this.prisma.favoriteDoctor.delete({
        where: { id: existingFavorite.id },
      });
      return { message: 'Doctor removed from favorites', isFavorite: false };
    } else {
      await this.prisma.favoriteDoctor.create({
        data: { userId, doctorProfileId },
      });
      return { message: 'Doctor added to favorites', isFavorite: true };
    }
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.favoriteDoctor.findMany({
      where: { userId },
      include: {
        doctorProfile: {
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
            specialty: { select: { id: true, name: true, iconUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => ({
      id: fav.doctorProfile.id,
      fullName: fav.doctorProfile.user.fullName,
      avatar: fav.doctorProfile.user.avatar,
      specialty: fav.doctorProfile.specialty.name,
      specialtyIcon: fav.doctorProfile.specialty.iconUrl,
      hospitalName: fav.doctorProfile.hospitalName,
      rating: fav.doctorProfile.rating,
      reviewsCount: fav.doctorProfile.reviewsCount,
      isFavorite: true,
      addedAt: fav.createdAt,
    }));
  }
}
