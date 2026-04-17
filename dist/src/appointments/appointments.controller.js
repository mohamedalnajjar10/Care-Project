"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const appointments_service_1 = require("./appointments.service");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const update_appointment_dto_1 = require("./dto/update-appointment.dto");
const appointment_query_dto_1 = require("./dto/appointment-query.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let AppointmentsController = class AppointmentsController {
    appointmentsService;
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    createAppointment(req, dto) {
        const patientId = req.user.id || req.user.sub;
        return this.appointmentsService.createAppointment(patientId, dto);
    }
    getMyAppointments(req, query) {
        const patientId = req.user.id || req.user.sub;
        return this.appointmentsService.getPatientAppointments(patientId, query);
    }
    async getDoctorTodayAppointments(req) {
        const doctorUserId = req.user.id || req.user.sub;
        const doctorProfile = await this.appointmentsService['prisma'].doctorProfile.findUnique({
            where: { userId: doctorUserId },
        });
        if (!doctorProfile) {
            throw new Error('Doctor profile not found');
        }
        return this.appointmentsService.getDoctorTodayAppointments(doctorProfile.id);
    }
    async getDoctorAppointments(req, query) {
        const doctorUserId = req.user.id || req.user.sub;
        const doctorProfile = await this.appointmentsService['prisma'].doctorProfile.findUnique({
            where: { userId: doctorUserId },
        });
        if (!doctorProfile) {
            throw new Error('Doctor profile not found');
        }
        return this.appointmentsService.getDoctorAppointments(doctorProfile.id, query);
    }
    updateByPatient(req, id, dto) {
        const patientId = req.user.id || req.user.sub;
        return this.appointmentsService.updateAppointmentByPatient(patientId, id, dto);
    }
    updateByDoctor(req, id, dto) {
        const doctorUserId = req.user.id || req.user.sub;
        return this.appointmentsService.updateAppointmentByDoctor(doctorUserId, id, dto);
    }
    cancelAppointment(req, id, cancelReason) {
        const userId = req.user.id || req.user.sub;
        return this.appointmentsService.cancelAppointment(userId, id, cancelReason);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Create appointment (pending payment)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "createAppointment", null);
__decorate([
    (0, common_1.Get)('my-appointments'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get my appointments (patient)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, appointment_query_dto_1.AppointmentQueryDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "getMyAppointments", null);
__decorate([
    (0, common_1.Get)('doctor/today'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, swagger_1.ApiOperation)({ summary: "Get today's appointments (doctor)" }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getDoctorTodayAppointments", null);
__decorate([
    (0, common_1.Get)('doctor/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get all appointments (doctor)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, appointment_query_dto_1.AppointmentQueryDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getDoctorAppointments", null);
__decorate([
    (0, common_1.Patch)(':id/patient'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update/reschedule appointment (patient)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_appointment_dto_1.UpdateAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "updateByPatient", null);
__decorate([
    (0, common_1.Patch)(':id/doctor'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update/reschedule appointment (doctor)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_appointment_dto_1.UpdateAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "updateByDoctor", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel appointment' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('cancelReason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "cancelAppointment", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, swagger_1.ApiTags)('Appointments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('appointments'),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map