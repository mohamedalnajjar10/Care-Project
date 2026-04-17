import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './user.service';

@ApiTags('Users (Doctors & Patients)')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UsersService) { }

  @Post("create")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = parseInt(page ?? '1', 10);
    const limitNumber = parseInt(limit ?? '10', 10);
    return await this.userService.findAll(pageNumber, limitNumber);
  }

  @Get('mobile/:mobile')
  @ApiOperation({ summary: 'Get user by mobile number' })
  async findByMobile(
    @Param('mobile') mobile: string,
    @Req() req: any,
  ) {
    const currentUserId = req.user.id || req.user.sub;
    const currentUserRole = req.user.role;

    return await this.userService.findByMobile(mobile, currentUserId, currentUserRole);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    const currentUserId = req.user.id || req.user.sub;
    const currentUserRole = req.user.role;
    return await this.userService.findById(id, currentUserId, currentUserRole);
  }

  @Patch('/update/:id')
  @ApiOperation({ summary: 'Update user details (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    const currentUserId = req.user.id || req.user.sub;
    const currentUserRole = req.user.role;
    return await this.userService.update(id, updateUserDto, currentUserId, currentUserRole);
  }

  @Delete('/delete/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const currentUserId = req.user.id || req.user.sub;
    const currentUserRole = req.user.role;
    return await this.userService.remove(id, currentUserId, currentUserRole);
  }
}
