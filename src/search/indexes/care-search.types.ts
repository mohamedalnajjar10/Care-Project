export type CareSearchDocType = 'doctor' | 'specialty';

export interface CareSearchDocumentBase {
  id: string;          // unique per doc in meili (Primary Key)
  type: CareSearchDocType;
  title: string;       // main searchable text
  subtitle?: string;   // extra searchable text
  tags?: string[];     // searchable terms
  createdAt: number;   // sortable
}

export interface CareSearchDoctorDocument extends CareSearchDocumentBase {
  type: 'doctor';
  doctorProfileId: string; // present for indexing
  userId: string;
  specialtyId: string;
  rating: number;      // sortable
  experience: number;  // sortable
}

export interface CareSearchSpecialtyDocument extends CareSearchDocumentBase {
  type: 'specialty';
  specialtyId: string;
}

export type CareSearchDocument = CareSearchDoctorDocument | CareSearchSpecialtyDocument;

// --- Main change ---
// ResultItem matches Document so `id` is always present
export type CareSearchResultItem = CareSearchDocument;

