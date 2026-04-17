import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
    @IsString()
    @IsNotEmpty()
    googleId: string;

    @IsEmail()
    @IsOptional()
    email: string | null;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    avatar: string | null;
}