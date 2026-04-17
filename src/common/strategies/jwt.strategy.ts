import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from 'src/user/user.service';
import { AUTH_ERROR_MESSAGES } from '../../auth/constants/auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || process.env.JWT_ACCESS_SECRET || 'secret',
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        if (!user.isActive) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
        }

        return user;
    }
}
