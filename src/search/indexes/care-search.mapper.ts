import { DoctorProfile, Specialty, User } from '@prisma/client';
import { CareSearchDoctorDocument, CareSearchSpecialtyDocument } from './care-search.types';

type DoctorWithRelations = DoctorProfile & {
    user: Pick<User, 'id' | 'fullName'>;
    specialty: Pick<Specialty, 'id' | 'name'>;
};

export class CareSearchMapper {
    static doctorToDocument(d: DoctorWithRelations): CareSearchDoctorDocument {
        return {
            id: `doctor_${d.id}`,
            type: 'doctor',
            doctorProfileId: d.id,
            userId: d.userId,
            specialtyId: d.specialtyId,
            title: d.user.fullName,
            subtitle: `${d.specialty.name} - ${d.hospitalName}`,
            tags: [d.specialty.name, d.hospitalName],
            rating: Number(d.rating ?? 0),
            experience: Number(d.experience ?? 0),
            createdAt: d.createdAt.getTime(),
        };
    }

    static specialtyToDocument(s: Specialty): CareSearchSpecialtyDocument {
        return {
            id: `specialty_${s.id}`,
            type: 'specialty',
            specialtyId: s.id,
            title: s.name,
            subtitle: 'Specialty',
            tags: [],
            createdAt: s.createdAt.getTime(),
        };
    }
}