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
var AppointmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const client_2 = require("@prisma/client");
let AppointmentsService = AppointmentsService_1 = class AppointmentsService {
    prisma;
    notificationsService;
    logger = new common_1.Logger(AppointmentsService_1.name);
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async createAppointment(patientId, dto) {
        const doctor = await this.prisma.doctorProfile.findUnique({
            where: { id: dto.doctorProfileId },
            include: { user: true },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor profile not found');
        }
        const appointmentDate = new Date(dto.appointmentDate);
        if (appointmentDate <= new Date()) {
            throw new common_1.BadRequestException('Appointment date must be in the future');
        }
        const existingAppointment = await this.prisma.appointment.findFirst({
            where: {
                doctorProfileId: dto.doctorProfileId,
                appointmentDate,
                status: {
                    in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED],
                },
            },
        });
        if (existingAppointment) {
            throw new common_1.BadRequestException('This time slot is already booked');
        }
        const appointment = await this.prisma.appointment.create({
            data: {
                patientId,
                doctorProfileId: dto.doctorProfileId,
                appointmentDate,
                notes: dto.notes,
                status: client_1.AppointmentStatus.PENDING,
            },
            include: {
                doctorProfile: {
                    include: {
                        user: true,
                        specialty: true,
                    },
                },
                patient: true,
            },
        });
        this.logger.log(`Appointment created: ${appointment.id}`);
        return {
            appointment,
            paymentRequired: true,
            amount: doctor.consultationFee,
        };
    }
    async confirmAppointment(appointmentId, transactionId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctorProfile: { include: { user: true } },
                patient: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: client_1.AppointmentStatus.CONFIRMED },
            include: {
                doctorProfile: {
                    include: {
                        user: true,
                        specialty: true,
                    },
                },
                patient: true,
            },
        });
        await this.notificationsService.createNotification({
            userId: appointment.doctorProfile.userId,
            type: client_2.NotificationType.APPOINTMENT_CONFIRMED,
            title: 'New Appointment Confirmed',
            message: `${appointment.patient.fullName} has booked an appointment on ${appointment.appointmentDate.toLocaleString()}`,
            data: { appointmentId: appointment.id },
        });
        await this.notificationsService.createNotification({
            userId: appointment.patientId,
            type: client_2.NotificationType.APPOINTMENT_CONFIRMED,
            title: 'Appointment Confirmed',
            message: `Your appointment with Dr. ${appointment.doctorProfile.user.fullName} is confirmed`,
            data: { appointmentId: appointment.id },
        });
        this.logger.log(`Appointment confirmed: ${appointmentId}`);
        return updatedAppointment;
    }
    async getPatientAppointments(patientId, query) {
        const { status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = { patientId };
        if (status) {
            where.status = status;
        }
        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: {
                    doctorProfile: {
                        include: {
                            user: true,
                            specialty: true,
                        },
                    },
                    payment: true,
                },
                orderBy: { appointmentDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.appointment.count({ where }),
        ]);
        return {
            data: appointments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getDoctorTodayAppointments(doctorProfileId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const appointments = await this.prisma.appointment.findMany({
            where: {
                doctorProfileId,
                appointmentDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    in: [client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentStatus.PENDING],
                },
            },
            include: {
                patient: true,
                payment: true,
            },
            orderBy: { appointmentDate: 'asc' },
        });
        return appointments;
    }
    async getDoctorAppointments(doctorProfileId, query) {
        const { status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = { doctorProfileId };
        if (status) {
            where.status = status;
        }
        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: {
                    patient: true,
                    payment: true,
                },
                orderBy: { appointmentDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.appointment.count({ where }),
        ]);
        return {
            data: appointments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateAppointmentByPatient(patientId, appointmentId, dto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctorProfile: { include: { user: true } },
                patient: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.patientId !== patientId) {
            throw new common_1.ForbiddenException('You can only update your own appointments');
        }
        if (appointment.status === client_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot update completed appointment');
        }
        if (dto.appointmentDate) {
            const newDate = new Date(dto.appointmentDate);
            if (newDate <= new Date()) {
                throw new common_1.BadRequestException('New appointment date must be in the future');
            }
            const conflict = await this.prisma.appointment.findFirst({
                where: {
                    doctorProfileId: appointment.doctorProfileId,
                    appointmentDate: newDate,
                    status: {
                        in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED],
                    },
                    id: { not: appointmentId },
                },
            });
            if (conflict) {
                throw new common_1.BadRequestException('This time slot is already booked');
            }
            dto.status = client_1.AppointmentStatus.RESCHEDULED;
        }
        if (dto.status === client_1.AppointmentStatus.CANCELLED) {
            if (!dto.cancelReason) {
                throw new common_1.BadRequestException('Cancel reason is required');
            }
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: dto,
            include: {
                doctorProfile: {
                    include: {
                        user: true,
                        specialty: true,
                    },
                },
                patient: true,
            },
        });
        if (dto.status === client_1.AppointmentStatus.CANCELLED) {
            await this.notificationsService.createNotification({
                userId: appointment.doctorProfile.userId,
                type: client_2.NotificationType.APPOINTMENT_CANCELLED,
                title: 'Appointment Cancelled',
                message: `${appointment.patient.fullName} has cancelled their appointment`,
                data: {
                    appointmentId: appointment.id,
                    reason: dto.cancelReason,
                },
            });
        }
        else if (dto.appointmentDate) {
            await this.notificationsService.createNotification({
                userId: appointment.doctorProfile.userId,
                type: client_2.NotificationType.APPOINTMENT_RESCHEDULED,
                title: 'Appointment Rescheduled',
                message: `${appointment.patient.fullName} has rescheduled their appointment to ${new Date(dto.appointmentDate).toLocaleString()}`,
                data: {
                    appointmentId: appointment.id,
                    newDate: dto.appointmentDate,
                },
            });
        }
        this.logger.log(`Appointment updated by patient: ${appointmentId}`);
        return updatedAppointment;
    }
    async updateAppointmentByDoctor(doctorUserId, appointmentId, dto) {
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
            where: { userId: doctorUserId },
        });
        if (!doctorProfile) {
            throw new common_1.NotFoundException('Doctor profile not found');
        }
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctorProfile: { include: { user: true } },
                patient: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.doctorProfileId !== doctorProfile.id) {
            throw new common_1.ForbiddenException('You can only update your own appointments');
        }
        if (appointment.status === client_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot update completed appointment');
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: dto,
            include: {
                doctorProfile: {
                    include: {
                        user: true,
                        specialty: true,
                    },
                },
                patient: true,
            },
        });
        if (dto.status === client_1.AppointmentStatus.CANCELLED) {
            await this.notificationsService.createNotification({
                userId: appointment.patientId,
                type: client_2.NotificationType.APPOINTMENT_CANCELLED,
                title: 'Appointment Cancelled',
                message: `Dr. ${appointment.doctorProfile.user.fullName} has cancelled your appointment`,
                data: {
                    appointmentId: appointment.id,
                    reason: dto.cancelReason,
                },
            });
        }
        else if (dto.appointmentDate) {
            await this.notificationsService.createNotification({
                userId: appointment.patientId,
                type: client_2.NotificationType.APPOINTMENT_RESCHEDULED,
                title: 'Appointment Rescheduled',
                message: `Dr. ${appointment.doctorProfile.user.fullName} has rescheduled your appointment to ${new Date(dto.appointmentDate).toLocaleString()}`,
                data: {
                    appointmentId: appointment.id,
                    newDate: dto.appointmentDate,
                },
            });
        }
        this.logger.log(`Appointment updated by doctor: ${appointmentId}`);
        return updatedAppointment;
    }
    async cancelAppointment(userId, appointmentId, cancelReason) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctorProfile: { include: { user: true } },
                patient: true,
                payment: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        const isPatient = appointment.patientId === userId;
        const isDoctor = appointment.doctorProfile.userId === userId;
        if (!isPatient && !isDoctor) {
            throw new common_1.ForbiddenException('You cannot cancel this appointment');
        }
        if (appointment.status === client_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel completed appointment');
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
                cancelReason,
            },
            include: {
                doctorProfile: {
                    include: {
                        user: true,
                        specialty: true,
                    },
                },
                patient: true,
            },
        });
        if (isPatient) {
            await this.notificationsService.createNotification({
                userId: appointment.doctorProfile.userId,
                type: client_2.NotificationType.APPOINTMENT_CANCELLED,
                title: 'Appointment Cancelled',
                message: `${appointment.patient.fullName} has cancelled their appointment`,
                data: { appointmentId: appointment.id, reason: cancelReason },
            });
        }
        else {
            await this.notificationsService.createNotification({
                userId: appointment.patientId,
                type: client_2.NotificationType.APPOINTMENT_CANCELLED,
                title: 'Appointment Cancelled',
                message: `Dr. ${appointment.doctorProfile.user.fullName} has cancelled your appointment`,
                data: { appointmentId: appointment.id, reason: cancelReason },
            });
        }
        this.logger.log(`Appointment cancelled: ${appointmentId}`);
        return updatedAppointment;
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = AppointmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map