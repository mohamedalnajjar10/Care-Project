import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SmsModule } from '../sms/sms.module';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from 'src/common/strategies/google.strategy';


@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get('ACCESS_TOKEN_EXPIRES_IN', '15m') },
      }),
      inject: [ConfigService],
    }),

    UserModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule { }
