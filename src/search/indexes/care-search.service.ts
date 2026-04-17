import { Injectable } from '@nestjs/common';
import { MeiliService } from '../meili/meili.service';
import { CareSearchDocument } from './care-search.types';
import { SortDoctorsBy } from 'src/doctors/dto/search-doctors.dto';

@Injectable()
export class CareSearchService {
    constructor(private readonly meili: MeiliService) { }

    async search(params: {
        term: string;
        page: number;
        limit: number;
        specialtyId?: string;
        sortBy?: SortDoctorsBy;
        types?: Array<'doctor' | 'specialty'>;
    }): Promise<{ items: CareSearchDocument[]; total: number }> {
        const index = this.meili.getIndex();

        const filter: string[] = [];

        if (params.specialtyId) filter.push(`specialtyId = "${params.specialtyId}"`);
        if (params.types?.length) {
            const types = params.types.map((t) => `"${t}"`).join(',');
            filter.push(`type IN [${types}]`);
        }

        const sort =
            params.sortBy === SortDoctorsBy.RATING
                ? ['rating:desc']
                : params.sortBy === SortDoctorsBy.EXPERIENCE
                    ? ['experience:desc']
                    : ['createdAt:desc'];

        const res = await index.search<CareSearchDocument>(params.term, {
            filter: filter.length ? filter : undefined,
            sort,
            limit: params.limit,
            offset: (params.page - 1) * params.limit,
            // Omit attributesToRetrieve to return all fields from the index
        });

        // Return hits as-is; they include doctorProfileId and specialtyId
        return {
            items: res.hits ?? [],
            total: res.estimatedTotalHits ?? 0,
        };
    }
}