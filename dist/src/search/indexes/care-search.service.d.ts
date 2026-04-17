import { MeiliService } from '../meili/meili.service';
import { CareSearchDocument } from './care-search.types';
import { SortDoctorsBy } from 'src/doctors/dto/search-doctors.dto';
export declare class CareSearchService {
    private readonly meili;
    constructor(meili: MeiliService);
    search(params: {
        term: string;
        page: number;
        limit: number;
        specialtyId?: string;
        sortBy?: SortDoctorsBy;
        types?: Array<'doctor' | 'specialty'>;
    }): Promise<{
        items: CareSearchDocument[];
        total: number;
    }>;
}
