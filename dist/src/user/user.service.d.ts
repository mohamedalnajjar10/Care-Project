import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByMobile(mobile: string, currentUserId?: string, currentUserRole?: string): Promise<User | null>;
    findById(id: string, currentUserId?: string, currentUserRole?: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    create(data: CreateUserDto): Promise<User>;
    findAll(page?: number, limit?: number): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    update(id: string, data: UpdateUserDto, currentUserId?: string, currentUserRole?: string): Promise<User>;
    remove(id: string, currentUserId?: string, currentUserRole?: string): Promise<{
        message: string;
    }>;
    updateVerified(userId: string): Promise<User>;
    updateLastLogin(userId: string): Promise<User>;
}
