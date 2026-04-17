"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const meili_service_1 = require("./meili/meili.service");
const meili_client_1 = require("./meili/meili.client");
const care_search_service_1 = require("./indexes/care-search.service");
const care_search_indexer_1 = require("./indexes/care-search.indexer");
const prisma_service_1 = require("../../prisma/prisma.service");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            meili_client_1.MeiliClientProvider,
            meili_service_1.MeiliService,
            care_search_service_1.CareSearchService,
            care_search_indexer_1.CareSearchIndexer,
            prisma_service_1.PrismaService,
        ],
        exports: [meili_service_1.MeiliService, care_search_service_1.CareSearchService, care_search_indexer_1.CareSearchIndexer],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map