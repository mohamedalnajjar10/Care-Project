import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CreateAddressFromMapDto } from './dto/create-address-from-map.dto';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { CurrentUser } from './interfaces/current-user.interface';
import { UserAddressService } from './user-address.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateAddressDto } from './dto/update-user-address.dto';

interface AuthenticatedRequest extends Request {
  user: CurrentUser;
}

@ApiTags('User Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/addresses')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new address manually for current user' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserAddressDto,
  ) {
    return this.userAddressService.create(req.user.sub, dto);
  }

  @Post('from-map')
  @ApiOperation({ summary: 'Create a new address from map coordinates' })
  async createFromMap(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAddressFromMapDto,
  ) {
    console.log("User from Token:", req.user);
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      throw new BadRequestException('User ID is missing from token');
    }
    return this.userAddressService.createFromMap(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses for current user' })
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.userAddressService.findAllByUser(req.user.sub);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default address for current user' })
  async findDefault(@Req() req: AuthenticatedRequest) {
    return this.userAddressService.findDefaultByUser(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by id for current user' })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.userAddressService.findOneById(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address for current user' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.userAddressService.update(req.user.sub, id, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiParam({ name: 'id', type: String })
  async setDefault(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.userAddressService.setDefault(req.user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address for current user' })
  @ApiParam({ name: 'id', type: String })
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.userAddressService.remove(req.user.sub, id);

    return {
      message: 'Address deleted successfully',
    };
  }
}
