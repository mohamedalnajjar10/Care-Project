import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findByMobile(mobile: string, currentUserId?: string, currentUserRole?: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { mobile },
    });
    if (!currentUserId && !currentUserRole) {
      return user;
    }
    if (!user) {
      throw new NotFoundException('User not found with this mobile number');
    }
    if (currentUserRole !== UserRole.ADMIN && user.id !== currentUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return user;
  }

  async findById(id: string, currentUserId?: string, currentUserRole?: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!currentUserId && !currentUserRole) {
      return user;
    }

    if (!user) {
      throw new NotFoundException('User not found in the system');
    }

    if (currentUserRole !== UserRole.ADMIN && user.id !== currentUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          fullName: data.fullName,
          mobile: data.mobile,
          email: data.email,
          role: data.role || UserRole.PATIENT,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Phone number or email is already registered');
      }
      throw new InternalServerErrorException('An error occurred while creating the user');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      totalPages: Math.ceil(total / limit),
      total,
      page,
      limit,
      data,
    };
  }

  async update(id: string, data: UpdateUserDto, currentUserId?: string, currentUserRole?: string): Promise<User> {
    const user = await this.findById(id, currentUserId, currentUserRole);
    if (!user) {
      throw new NotFoundException('User not found in the system');
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Phone number or email is already registered');
      }
      throw new InternalServerErrorException('An error occurred while updating the user');
    }
  }

  async remove(id: string, currentUserId?: string, currentUserRole?: string): Promise<{ message: string }> {
    const user = await this.findById(id, currentUserId, currentUserRole);

    if (!user) {
      throw new NotFoundException('User not found in the system');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully'
    };
  }

  async updateVerified(userId: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
      },
    });
  }

  async updateLastLogin(userId: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
