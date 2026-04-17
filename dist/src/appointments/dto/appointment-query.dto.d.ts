import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentQueryDto {
    status?: AppointmentStatus;
    page?: number;
    limit?: number;
}
