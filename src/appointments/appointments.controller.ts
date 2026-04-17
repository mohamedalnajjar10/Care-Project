import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Create appointment (pending payment)' })
  createAppointment(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    const patientId = req.user.id || req.user.sub;
    return this.appointmentsService.createAppointment(patientId, dto);
  }

  @Get('my-appointments')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Get my appointments (patient)' })
  getMyAppointments(@Req() req: any, @Query() query: AppointmentQueryDto) {
    const patientId = req.user.id || req.user.sub;
    return this.appointmentsService.getPatientAppointments(patientId, query);
  }

  @Get('doctor/today')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: "Get today's appointments (doctor)" })
  async getDoctorTodayAppointments(@Req() req: any) {
    const doctorUserId = req.user.id || req.user.sub;
    const doctorProfile = await this.appointmentsService['prisma'].doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctorProfile) {
      throw new Error('Doctor profile not found');
    }
    return this.appointmentsService.getDoctorTodayAppointments(doctorProfile.id);
  }

  @Get('doctor/all')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get all appointments (doctor)' })
  async getDoctorAppointments(@Req() req: any, @Query() query: AppointmentQueryDto) {
    const doctorUserId = req.user.id || req.user.sub;
    const doctorProfile = await this.appointmentsService['prisma'].doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctorProfile) {
      throw new Error('Doctor profile not found');
    }
    return this.appointmentsService.getDoctorAppointments(doctorProfile.id, query);
  }

  @Patch(':id/patient')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Update/reschedule appointment (patient)' })
  updateByPatient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const patientId = req.user.id || req.user.sub;
    return this.appointmentsService.updateAppointmentByPatient(patientId, id, dto);
  }

  @Patch(':id/doctor')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Update/reschedule appointment (doctor)' })
  updateByDoctor(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const doctorUserId = req.user.id || req.user.sub;
    return this.appointmentsService.updateAppointmentByDoctor(doctorUserId, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancelAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body('cancelReason') cancelReason: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.appointmentsService.cancelAppointment(userId, id, cancelReason);
  }
}
