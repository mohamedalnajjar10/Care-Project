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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MeiliService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeiliService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const meili_constants_1 = require("./meili.constants");
let MeiliService = MeiliService_1 = class MeiliService {
    client;
    config;
    logger = new common_1.Logger(MeiliService_1.name);
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }
    async onModuleInit() {
        const indexName = this.config.get('MEILI_SEARCH_INDEX', 'care_search');
        try {
            await this.client.getIndex(indexName);
            this.logger.log(`✅ Meilisearch index "${indexName}" is ready.`);
        }
        catch (error) {
            const errorCode = error.code || error.cause?.code;
            if (errorCode === 'index_not_found') {
                this.logger.warn(`⚠️ Index "${indexName}" not found. Creating it now...`);
                try {
                    await this.client.createIndex(indexName, { primaryKey: 'id' });
                    this.logger.log(`✅ Index "${indexName}" created successfully.`);
                }
                catch (createError) {
                    this.logger.error('❌ Failed to create Meilisearch index', createError);
                }
            }
            else {
                this.logger.error('❌ Error connecting to Meilisearch', error);
            }
        }
    }
    getIndex(indexName) {
        const name = indexName ?? this.config.get('MEILI_SEARCH_INDEX', 'care_search');
        return this.client.index(name);
    }
};
exports.MeiliService = MeiliService;
exports.MeiliService = MeiliService = MeiliService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(meili_constants_1.MEILI_CLIENT)),
    __metadata("design:paramtypes", [Function, config_1.ConfigService])
], MeiliService);
//# sourceMappingURL=meili.service.js.map