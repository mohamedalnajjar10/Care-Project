import { PartialType } from '@nestjs/swagger';
import { CreateUserAddressDto } from './create-user-address.dto';


export class UpdateAddressDto extends PartialType(CreateUserAddressDto) { }
    