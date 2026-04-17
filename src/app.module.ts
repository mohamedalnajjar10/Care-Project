import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SmsModule } from './sms/sms.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AddressModule } from './user-address/user-address.module';
import { MapsModule } from './maps/maps.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SearchModule } from './search/search.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UserModule, SmsModule,
    SearchModule,

  // Rate limiting
  ThrottlerModule.forRoot([
    {
      ttl: 60000,
      limit: 10,
    },
  ]),

    AddressModule,
    MapsModule,
    SpecialtiesModule,
    DoctorsModule,
    SearchModule,
    AppointmentsModule,
    PaymentsModule,
    NotificationsModule,
    ReviewsModule],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
