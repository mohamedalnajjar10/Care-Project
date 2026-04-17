import { UserAddress } from '@prisma/client';
import { MapsService } from '../maps/maps.service';
import { CreateAddressFromMapDto } from './dto/create-address-from-map.dto';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateAddressDto } from './dto/update-user-address.dto';
export declare class UserAddressService {
    private readonly prisma;
    private readonly mapsService;
    constructor(prisma: PrismaService, mapsService: MapsService);
    create(userId: string, dto: CreateUserAddressDto): Promise<UserAddress>;
    createFromMap(userId: string, dto: CreateAddressFromMapDto): Promise<UserAddress>;
    findAllByUser(userId: string): Promise<UserAddress[]>;
    findDefaultByUser(userId: string): Promise<UserAddress | null>;
    findOneById(userId: string, addressId: string): Promise<UserAddress>;
    update(userId: string, addressId: string, dto: UpdateAddressDto): Promise<UserAddress>;
    remove(userId: string, addressId: string): Promise<void>;
    setDefault(userId: string, addressId: string): Promise<UserAddress>;
    private ensureAddressOwnership;
    private shouldSetAsDefault;
    private clearDefaultAddress;
    private toDecimal;
}
