"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeiliClientProvider = void 0;
const config_1 = require("@nestjs/config");
const meili_constants_1 = require("./meili.constants");
const meilisearch_1 = require("meilisearch");
exports.MeiliClientProvider = {
    provide: meili_constants_1.MEILI_CLIENT,
    inject: [config_1.ConfigService],
    useFactory: (config) => {
        const host = config.get('MEILI_HOST', 'http://127.0.0.1:7700');
        const apiKey = config.get('MEILI_MASTER_KEY');
        return new meilisearch_1.Meilisearch({
            host,
            apiKey,
        });
    },
};
//# sourceMappingURL=meili.client.js.map