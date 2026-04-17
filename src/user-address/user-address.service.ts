import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserAddress } from '@prisma/client';
import { MapsService } from '../maps/maps.service';
import { CreateAddressFromMapDto } from './dto/create-address-from-map.dto';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateAddressDto } from './dto/update-user-address.dto';

@Injectable()
export class UserAddressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsService: MapsService,
  ) { }

  async create(
    userId: string,
    dto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    return this.prisma.$transaction(async (tx) => {
      const shouldSetAsDefault = await this.shouldSetAsDefault(
        userId,
        dto.isDefault,
      );

      if (shouldSetAsDefault) {
        await this.clearDefaultAddress(tx, userId);
      }

      return tx.userAddress.create({
        data: {
          userId,
          label: dto.label,
          title: dto.title,
          formattedAddress: dto.formattedAddress,
          placeId: dto.placeId,
          latitude: this.toDecimal(dto.latitude),
          longitude: this.toDecimal(dto.longitude),
          street: dto.street,
          area: dto.area,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          postalCode: dto.postalCode,
          buildingNumber: dto.buildingNumber,
          floor: dto.floor,
          apartmentNumber: dto.apartmentNumber,
          landmark: dto.landmark,
          notes: dto.notes,
          isDefault: shouldSetAsDefault,
        },
      });
    });
  }

  async createFromMap(
    userId: string,
    dto: CreateAddressFromMapDto,
  ): Promise<UserAddress> {
    const resolvedAddress = await this.mapsService.reverseGeocode(
      dto.latitude,
      dto.longitude,
    );

    return this.prisma.$transaction(async (tx) => {
      const shouldSetAsDefault = await this.shouldSetAsDefault(
        userId,
        dto.isDefault,
      );

      if (shouldSetAsDefault) {
        await this.clearDefaultAddress(tx, userId);
      }

      return tx.userAddress.create({
        data: {
          userId,
          label: dto.label,
          title: dto.title,
          formattedAddress: resolvedAddress.formattedAddress,
          placeId: resolvedAddress.placeId,
          latitude: this.toDecimal(dto.latitude),
          longitude: this.toDecimal(dto.longitude),
          street: resolvedAddress.street,
          area: resolvedAddress.area,
          city: resolvedAddress.city,
          state: resolvedAddress.state,
          country: resolvedAddress.country,
          postalCode: resolvedAddress.postalCode,
          landmark: dto.landmark,
          notes: dto.notes,
          isDefault: shouldSetAsDefault,
        },
      });
    });
  }

  async findAllByUser(userId: string): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefaultByUser(userId: string): Promise<UserAddress | null> {
    return this.prisma.userAddress.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async findOneById(userId: string, addressId: string): Promise<UserAddress> {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async update(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<UserAddress> {
    await this.ensureAddressOwnership(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      const shouldSetAsDefault = dto.isDefault === true;

      if (shouldSetAsDefault) {
        await this.clearDefaultAddress(tx, userId);
      }

      return tx.userAddress.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.formattedAddress !== undefined && {
            formattedAddress: dto.formattedAddress,
          }),
          ...(dto.placeId !== undefined && { placeId: dto.placeId }),
          ...(dto.latitude !== undefined && {
            latitude: this.toDecimal(dto.latitude),
          }),
          ...(dto.longitude !== undefined && {
            longitude: this.toDecimal(dto.longitude),
          }),
          ...(dto.street !== undefined && { street: dto.street }),
          ...(dto.area !== undefined && { area: dto.area }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
          ...(dto.buildingNumber !== undefined && {
            buildingNumber: dto.buildingNumber,
          }),
          ...(dto.floor !== undefined && { floor: dto.floor }),
          ...(dto.apartmentNumber !== undefined && {
            apartmentNumber: dto.apartmentNumber,
          }),
          ...(dto.landmark !== undefined && { landmark: dto.landmark }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const address = await this.findOneById(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({
        where: { id: address.id },
      });

      if (address.isDefault) {
        const latestAddress = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (latestAddress) {
          await tx.userAddress.update({
            where: { id: latestAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }

  async setDefault(userId: string, addressId: string): Promise<UserAddress> {
    await this.ensureAddressOwnership(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await this.clearDefaultAddress(tx, userId);

      return tx.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  private async ensureAddressOwnership(
    userId: string,
    addressId: string,
  ): Promise<void> {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: { id: true },
    });

    if (!address) {
      throw new ForbiddenException('You do not have access to this address');
    }
  }

  private async shouldSetAsDefault(
    userId: string,
    requestedDefault?: boolean,
  ): Promise<boolean> {
    if (requestedDefault) {
      return true;
    }

    const existingCount = await this.prisma.userAddress.count({
      where: { userId },
    });

    return existingCount === 0;
  }

  private async clearDefaultAddress(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    await tx.userAddress.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  private toDecimal(value: number): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }
}
