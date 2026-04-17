import { DoctorProfile, Specialty, User } from '@prisma/client';
import { CareSearchDoctorDocument, CareSearchSpecialtyDocument } from './care-search.types';
type DoctorWithRelations = DoctorProfile & {
    user: Pick<User, 'id' | 'fullName'>;
    specialty: Pick<Specialty, 'id' | 'name'>;
};
export declare class CareSearchMapper {
    static doctorToDocument(d: DoctorWithRelations): CareSearchDoctorDocument;
    static specialtyToDocument(s: Specialty): CareSearchSpecialtyDocument;
}
export {};
