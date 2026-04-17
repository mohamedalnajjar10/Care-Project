import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: 'Full name must be at least 2 characters' })
    @Matches(/^[a-zA-Z\s\u0600-\u06FF]+$/, {
        message: 'Full name can only contain letters and spaces'
    })
    fullName: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Mobile number must start with + and be in international format' })
    mobile: string;

    @IsOptional()
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email?: string;
}
