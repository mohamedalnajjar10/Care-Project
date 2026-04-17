import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MEILI_CLIENT } from './meili.constants';
import { Meilisearch } from 'meilisearch';

export const MeiliClientProvider: Provider = {
    provide: MEILI_CLIENT,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
        const host = config.get<string>('MEILI_HOST', 'http://127.0.0.1:7700');
        const apiKey = config.get<string>('MEILI_MASTER_KEY');

        return new Meilisearch({
            host,
            apiKey,
        });
    },
};