import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    createAppointment(req: any, dto: CreateAppointmentDto): Promise<{
        appointment: {
            doctorProfile: {
                user: {
                    mobile: string | null;
                    fullName: string;
                    email: string | null;
                    id: string;
                    googleId: string | null;
                    avatar: string | null;
                    isVerified: boolean;
                    isActive: boolean;
                    lastLoginAt: Date | null;
                    role: import("@prisma/client").$Enums.UserRole;
                    createdAt: Date;
                    updatedAt: Date;
                };
                specialty: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    iconUrl: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                specialtyId: string;
                hospitalName: string;
                workingHours: string;
                experience: number;
                consultationFee: import("@prisma/client/runtime/library").Decimal;
                about: string | null;
                rating: number;
                reviewsCount: number;
            };
            patient: {
                mobile: string | null;
                fullName: string;
                email: string | null;
                id: string;
                googleId: string | null;
                avatar: string | null;
                isVerified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                role: import("@prisma/client").$Enums.UserRole;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            doctorProfileId: string;
            appointmentDate: Date;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            cancelReason: string | null;
            patientId: string;
        };
        paymentRequired: boolean;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyAppointments(req: any, query: AppointmentQueryDto): Promise<{
        data: ({
            doctorProfile: {
                user: {
                    mobile: string | null;
                    fullName: string;
                    email: string | null;
                    id: string;
                    googleId: string | null;
                    avatar: string | null;
                    isVerified: boolean;
                    isActive: boolean;
                    lastLoginAt: Date | null;
                    role: import("@prisma/client").$Enums.UserRole;
                    createdAt: Date;
                    updatedAt: Date;
                };
                specialty: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    iconUrl: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                specialtyId: string;
                hospitalName: string;
                workingHours: string;
                experience: number;
                consultationFee: import("@prisma/client/runtime/library").Decimal;
                about: string | null;
                rating: number;
                reviewsCount: number;
            };
            payment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentStatus;
                appointmentId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                transactionId: string | null;
                paymentIntentId: string | null;
                paymentProviderId: string | null;
                paymentProviderData: import("@prisma/client/runtime/library").JsonValue | null;
                failureReason: string | null;
                refundTransactionId: string | null;
                refundedAt: Date | null;
                completedAt: Date | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            doctorProfileId: string;
            appointmentDate: Date;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            cancelReason: string | null;
            patientId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDoctorTodayAppointments(req: any): Promise<({
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            appointmentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            paymentIntentId: string | null;
            paymentProviderId: string | null;
            paymentProviderData: import("@prisma/client/runtime/library").JsonValue | null;
            failureReason: string | null;
            refundTransactionId: string | null;
            refundedAt: Date | null;
            completedAt: Date | null;
        } | null;
        patient: {
            mobile: string | null;
            fullName: string;
            email: string | null;
            id: string;
            googleId: string | null;
            avatar: string | null;
            isVerified: boolean;
            isActive: boolean;
            lastLoginAt: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        doctorProfileId: string;
        appointmentDate: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        cancelReason: string | null;
        patientId: string;
    })[]>;
    getDoctorAppointments(req: any, query: AppointmentQueryDto): Promise<{
        data: ({
            payment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentStatus;
                appointmentId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                transactionId: string | null;
                paymentIntentId: string | null;
                paymentProviderId: string | null;
                paymentProviderData: import("@prisma/client/runtime/library").JsonValue | null;
                failureReason: string | null;
                refundTransactionId: string | null;
                refundedAt: Date | null;
                completedAt: Date | null;
            } | null;
            patient: {
                mobile: string | null;
                fullName: string;
                email: string | null;
                id: string;
                googleId: string | null;
                avatar: string | null;
                isVerified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                role: import("@prisma/client").$Enums.UserRole;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            doctorProfileId: string;
            appointmentDate: Date;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            cancelReason: string | null;
            patientId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateByPatient(req: any, id: string, dto: UpdateAppointmentDto): Promise<{
        doctorProfile: {
            user: {
                mobile: string | null;
                fullName: string;
                email: string | null;
                id: string;
                googleId: string | null;
                avatar: string | null;
                isVerified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                role: import("@prisma/client").$Enums.UserRole;
                createdAt: Date;
                updatedAt: Date;
            };
            specialty: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                iconUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            specialtyId: string;
            hospitalName: string;
            workingHours: string;
            experience: number;
            consultationFee: import("@prisma/client/runtime/library").Decimal;
            about: string | null;
            rating: number;
            reviewsCount: number;
        };
        patient: {
            mobile: string | null;
            fullName: string;
            email: string | null;
            id: string;
            googleId: string | null;
            avatar: string | null;
            isVerified: boolean;
            isActive: boolean;
            lastLoginAt: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        doctorProfileId: string;
        appointmentDate: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        cancelReason: string | null;
        patientId: string;
    }>;
    updateByDoctor(req: any, id: string, dto: UpdateAppointmentDto): Promise<{
        doctorProfile: {
            user: {
                mobile: string | null;
                fullName: string;
                email: string | null;
                id: string;
                googleId: string | null;
                avatar: string | null;
                isVerified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                role: import("@prisma/client").$Enums.UserRole;
                createdAt: Date;
                updatedAt: Date;
            };
            specialty: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                iconUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            specialtyId: string;
            hospitalName: string;
            workingHours: string;
            experience: number;
            consultationFee: import("@prisma/client/runtime/library").Decimal;
            about: string | null;
            rating: number;
            reviewsCount: number;
        };
        patient: {
            mobile: string | null;
            fullName: string;
            email: string | null;
            id: string;
            googleId: string | null;
            avatar: string | null;
            isVerified: boolean;
            isActive: boolean;
            lastLoginAt: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        doctorProfileId: string;
        appointmentDate: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        cancelReason: string | null;
        patientId: string;
    }>;
    cancelAppointment(req: any, id: string, cancelReason: string): Promise<{
        doctorProfile: {
            user: {
                mobile: string | null;
                fullName: string;
                email: string | null;
                id: string;
                googleId: string | null;
                avatar: string | null;
                isVerified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                role: import("@prisma/client").$Enums.UserRole;
                createdAt: Date;
                updatedAt: Date;
            };
            specialty: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                iconUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            specialtyId: string;
            hospitalName: string;
            workingHours: string;
            experience: number;
            consultationFee: import("@prisma/client/runtime/library").Decimal;
            about: string | null;
            rating: number;
            reviewsCount: number;
        };
        patient: {
            mobile: string | null;
            fullName: string;
            email: string | null;
            id: string;
            googleId: string | null;
            avatar: string | null;
            isVerified: boolean;
            isActive: boolean;
            lastLoginAt: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        doctorProfileId: string;
        appointmentDate: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        cancelReason: string | null;
        patientId: string;
    }>;
}
