import { Module } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { SpecialtiesController } from './specialties.controller';
import { PrismaService } from 'prisma/prisma.service'; 

@Module({
  controllers: [SpecialtiesController],
  providers: [SpecialtiesService, PrismaService],
})
export class SpecialtiesModule { }