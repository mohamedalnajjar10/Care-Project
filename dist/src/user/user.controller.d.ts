import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        mobile: string | null;
        fullName: string;
        email: string | null;
        id: string;
        googleId: string | null;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        lastLoginAt: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: string, limit?: string): Promise<{
        data: import("@prisma/client").User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByMobile(mobile: string, req: any): Promise<{
        mobile: string | null;
        fullName: string;
        email: string | null;
        id: string;
        googleId: string | null;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        lastLoginAt: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: string, req: any): Promise<{
        mobile: string | null;
        fullName: string;
        email: string | null;
        id: string;
        googleId: string | null;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        lastLoginAt: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto, req: any): Promise<{
        mobile: string | null;
        fullName: string;
        email: string | null;
        id: string;
        googleId: string | null;
        avatar: string | null;
        isVerified: boolean;
        isActive: boolean;
        lastLoginAt: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
