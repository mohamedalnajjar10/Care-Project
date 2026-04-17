import { Module } from '@nestjs/common';
import { UserAddressController } from './user-address.controller';
import { UserAddressService } from './user-address.service';
import { PrismaService } from 'prisma/prisma.service';
import { MapsModule } from 'src/maps/maps.module';


@Module({
  imports: [MapsModule],
  controllers: [UserAddressController],
  providers: [UserAddressService, PrismaService],
  exports: [UserAddressService]
})
export class AddressModule { }
