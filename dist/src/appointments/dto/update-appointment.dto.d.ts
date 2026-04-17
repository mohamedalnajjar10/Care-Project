import { AppointmentStatus } from '@prisma/client';
export declare class UpdateAppointmentDto {
    appointmentDate?: string;
    status?: AppointmentStatus;
    notes?: string;
    cancelReason?: string;
}
