import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    fullName: string;
    mobile: string;
    email?: string;
    role?: UserRole;
}
