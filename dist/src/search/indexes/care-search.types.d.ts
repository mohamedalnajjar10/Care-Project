export type CareSearchDocType = 'doctor' | 'specialty';
export interface CareSearchDocumentBase {
    id: string;
    type: CareSearchDocType;
    title: string;
    subtitle?: string;
    tags?: string[];
    createdAt: number;
}
export interface CareSearchDoctorDocument extends CareSearchDocumentBase {
    type: 'doctor';
    doctorProfileId: string;
    userId: string;
    specialtyId: string;
    rating: number;
    experience: number;
}
export interface CareSearchSpecialtyDocument extends CareSearchDocumentBase {
    type: 'specialty';
    specialtyId: string;
}
export type CareSearchDocument = CareSearchDoctorDocument | CareSearchSpecialtyDocument;
export type CareSearchResultItem = CareSearchDocument;
