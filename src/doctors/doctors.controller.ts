import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Doctors & Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) { }

  @Post('profile')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Create medical profile (doctors only)' })
  createMyProfile(@Req() req: any, @Body() dto: CreateDoctorProfileDto) {
    const userId = req.user.id || req.user.sub;
    return this.doctorsService.createProfileForDoctor(userId, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search, filter, and sort doctors and specialties' })
  searchDoctors(@Req() req: any, @Query() query: SearchDoctorsDto) {
    const userId = req.user.id || req.user.sub;
    return this.doctorsService.searchDoctors(userId, query);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'List favorite doctors' })
  async getMyFavorites(@Req() req: any) {
    return this.doctorsService.getFavorites(req.user.id);
  }

  @Post('favorite/:doctorProfileId/toggle')
  @UseGuards(RolesGuard) 
  @Roles(Role.PATIENT)  
  @ApiOperation({ summary: 'Add or remove doctor from favorites (patients only)' })
  async toggleFavorite(@Req() req: any, @Param('doctorProfileId') doctorProfileId: string) {
    return this.doctorsService.toggleFavorite(req.user.id, doctorProfileId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync doctors and specialties to search index (manual run)' })
  async syncDoctors() {
    return this.doctorsService.syncAllDoctorsToSearch();
  }

  // @Get('debug-meili')
  // @ApiOperation({ summary: 'Dump Meilisearch sample data for debugging' })
  // async debugMeili() {
  //   return this.doctorsService.debugMeiliContent();
  // }
}
