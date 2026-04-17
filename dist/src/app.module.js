"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const sms_module_1 = require("./sms/sms.module");
const prisma_module_1 = require("../prisma/prisma.module");
const throttler_1 = require("@nestjs/throttler");
const user_address_module_1 = require("./user-address/user-address.module");
const maps_module_1 = require("./maps/maps.module");
const specialties_module_1 = require("./specialties/specialties.module");
const doctors_module_1 = require("./doctors/doctors.module");
const search_module_1 = require("./search/search.module");
const appointments_module_1 = require("./appointments/appointments.module");
const payments_module_1 = require("./payments/payments.module");
const notifications_module_1 = require("./notifications/notifications.module");
const reviews_module_1 = require("./reviews/reviews.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({ isGlobal: true }), prisma_module_1.PrismaModule, auth_module_1.AuthModule, user_module_1.UserModule, sms_module_1.SmsModule,
            search_module_1.SearchModule,
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            user_address_module_1.AddressModule,
            maps_module_1.MapsModule,
            specialties_module_1.SpecialtiesModule,
            doctors_module_1.DoctorsModule,
            search_module_1.SearchModule,
            appointments_module_1.AppointmentsModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            reviews_module_1.ReviewsModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map