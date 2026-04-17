"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareSearchService = void 0;
const common_1 = require("@nestjs/common");
const meili_service_1 = require("../meili/meili.service");
const search_doctors_dto_1 = require("../../doctors/dto/search-doctors.dto");
let CareSearchService = class CareSearchService {
    meili;
    constructor(meili) {
        this.meili = meili;
    }
    async search(params) {
        const index = this.meili.getIndex();
        const filter = [];
        if (params.specialtyId)
            filter.push(`specialtyId = "${params.specialtyId}"`);
        if (params.types?.length) {
            const types = params.types.map((t) => `"${t}"`).join(',');
            filter.push(`type IN [${types}]`);
        }
        const sort = params.sortBy === search_doctors_dto_1.SortDoctorsBy.RATING
            ? ['rating:desc']
            : params.sortBy === search_doctors_dto_1.SortDoctorsBy.EXPERIENCE
                ? ['experience:desc']
                : ['createdAt:desc'];
        const res = await index.search(params.term, {
            filter: filter.length ? filter : undefined,
            sort,
            limit: params.limit,
            offset: (params.page - 1) * params.limit,
        });
        return {
            items: res.hits ?? [],
            total: res.estimatedTotalHits ?? 0,
        };
    }
};
exports.CareSearchService = CareSearchService;
exports.CareSearchService = CareSearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meili_service_1.MeiliService])
], CareSearchService);
//# sourceMappingURL=care-search.service.js.map