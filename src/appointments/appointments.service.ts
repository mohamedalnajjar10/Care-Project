import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Create appointment (without payment - pending)
   */
  async createAppointment(patientId: string, dto: CreateAppointmentDto) {
    // Validate doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorProfileId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Validate appointment date is in the future
    const appointmentDate = new Date(dto.appointmentDate);
    if (appointmentDate <= new Date()) {
      throw new BadRequestException('Appointment date must be in the future');
    }

    // Check if slot is available
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorProfileId: dto.doctorProfileId,
        appointmentDate,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        doctorProfileId: dto.doctorProfileId,
        appointmentDate,
        notes: dto.notes,
        status: AppointmentStatus.PENDING,
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

  /**
   * Confirm appointment after successful payment
   */
  async confirmAppointment(appointmentId: string, transactionId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CONFIRMED },
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

    // Send notification to doctor
    await this.notificationsService.createNotification({
      userId: appointment.doctorProfile.userId,
      type: NotificationType.APPOINTMENT_CONFIRMED,
      title: 'New Appointment Confirmed',
      message: `${appointment.patient.fullName} has booked an appointment on ${appointment.appointmentDate.toLocaleString()}`,
      data: { appointmentId: appointment.id },
    });

    // Send notification to patient
    await this.notificationsService.createNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CONFIRMED,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${appointment.doctorProfile.user.fullName} is confirmed`,
      data: { appointmentId: appointment.id },
    });

    this.logger.log(`Appointment confirmed: ${appointmentId}`);

    return updatedAppointment;
  }

  /**
   * Get patient's appointments
   */
  async getPatientAppointments(patientId: string, query: AppointmentQueryDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { patientId };
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

  /**
   * Get doctor's appointments for today
   */
  async getDoctorTodayAppointments(doctorProfileId: string) {
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
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
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

  /**
   * Get all doctor appointments with pagination
   */
  async getDoctorAppointments(doctorProfileId: string, query: AppointmentQueryDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { doctorProfileId };
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

  /**
   * Update appointment by patient
   */
  async updateAppointmentByPatient(
    patientId: string,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('You can only update your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed appointment');
    }

    // Handle rescheduling
    if (dto.appointmentDate) {
      const newDate = new Date(dto.appointmentDate);
      if (newDate <= new Date()) {
        throw new BadRequestException('New appointment date must be in the future');
      }

      // Check availability
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          doctorProfileId: appointment.doctorProfileId,
          appointmentDate: newDate,
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
          id: { not: appointmentId },
        },
      });

      if (conflict) {
        throw new BadRequestException('This time slot is already booked');
      }

      dto.status = AppointmentStatus.RESCHEDULED;
    }

    // Handle cancellation
    if (dto.status === AppointmentStatus.CANCELLED) {
      if (!dto.cancelReason) {
        throw new BadRequestException('Cancel reason is required');
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

    // Send notification to doctor
    if (dto.status === AppointmentStatus.CANCELLED) {
      await this.notificationsService.createNotification({
        userId: appointment.doctorProfile.userId,
        type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'Appointment Cancelled',
        message: `${appointment.patient.fullName} has cancelled their appointment`,
        data: {
          appointmentId: appointment.id,
          reason: dto.cancelReason,
        },
      });
    } else if (dto.appointmentDate) {
      await this.notificationsService.createNotification({
        userId: appointment.doctorProfile.userId,
        type: NotificationType.APPOINTMENT_RESCHEDULED,
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

  /**
   * Update appointment by doctor
   */
  async updateAppointmentByDoctor(
    doctorUserId: string,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctorProfileId !== doctorProfile.id) {
      throw new ForbiddenException('You can only update your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed appointment');
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

    // Send notification to patient
    if (dto.status === AppointmentStatus.CANCELLED) {
      await this.notificationsService.createNotification({
        userId: appointment.patientId,
        type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'Appointment Cancelled',
        message: `Dr. ${appointment.doctorProfile.user.fullName} has cancelled your appointment`,
        data: {
          appointmentId: appointment.id,
          reason: dto.cancelReason,
        },
      });
    } else if (dto.appointmentDate) {
      await this.notificationsService.createNotification({
        userId: appointment.patientId,
        type: NotificationType.APPOINTMENT_RESCHEDULED,
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

  /**
   * Cancel appointment (common method)
   */
  async cancelAppointment(userId: string, appointmentId: string, cancelReason: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patient: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check ownership
    const isPatient = appointment.patientId === userId;
    const isDoctor = appointment.doctorProfile.userId === userId;

    if (!isPatient && !isDoctor) {
      throw new ForbiddenException('You cannot cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointment');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
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

    // Send notifications
    if (isPatient) {
      await this.notificationsService.createNotification({
        userId: appointment.doctorProfile.userId,
        type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'Appointment Cancelled',
        message: `${appointment.patient.fullName} has cancelled their appointment`,
        data: { appointmentId: appointment.id, reason: cancelReason },
      });
    } else {
      await this.notificationsService.createNotification({
        userId: appointment.patientId,
        type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'Appointment Cancelled',
        message: `Dr. ${appointment.doctorProfile.user.fullName} has cancelled your appointment`,
        data: { appointmentId: appointment.id, reason: cancelReason },
      });
    }

    this.logger.log(`Appointment cancelled: ${appointmentId}`);

    return updatedAppointment;
  }
}
