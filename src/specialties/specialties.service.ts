import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('The specialization already exists');

    return this.prisma.specialty.create({ data: dto });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.specialty.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.specialty.count(),
    ]);

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  async update(id: string, dto: UpdateSpecialtyDto) {
    const specialty = await this.prisma.specialty.findUnique({ where: { id } });
    if (!specialty) throw new NotFoundException('The specialization does not exist');

    return this.prisma.specialty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const specialty = await this.prisma.specialty.findUnique({ where: { id } });
    if (!specialty) throw new NotFoundException('The specialization does not exist');

    await this.prisma.specialty.delete({ where: { id } });
    return { message: 'The specialization has been deleted successfully' };
  }
}
