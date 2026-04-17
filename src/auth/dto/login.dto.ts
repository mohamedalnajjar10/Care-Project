import { IsNotEmpty, IsString, Matches } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Mobile number must start with + and be in international format' })
    mobile: string;
}
