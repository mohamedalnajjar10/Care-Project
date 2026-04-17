"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressModule = void 0;
const common_1 = require("@nestjs/common");
const user_address_controller_1 = require("./user-address.controller");
const user_address_service_1 = require("./user-address.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const maps_module_1 = require("../maps/maps.module");
let AddressModule = class AddressModule {
};
exports.AddressModule = AddressModule;
exports.AddressModule = AddressModule = __decorate([
    (0, common_1.Module)({
        imports: [maps_module_1.MapsModule],
        controllers: [user_address_controller_1.UserAddressController],
        providers: [user_address_service_1.UserAddressService, prisma_service_1.PrismaService],
        exports: [user_address_service_1.UserAddressService]
    })
], AddressModule);
//# sourceMappingURL=user-address.module.js.map