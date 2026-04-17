import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Index, Meilisearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
import { MEILI_CLIENT } from './meili.constants';

@Injectable()
export class MeiliService implements OnModuleInit {
    private readonly logger = new Logger(MeiliService.name);

    constructor(
         @Inject(MEILI_CLIENT) public readonly client: Meilisearch, 
        private readonly config: ConfigService,
    ) { }

    async onModuleInit() {
        const indexName = this.config.get<string>('MEILI_SEARCH_INDEX', 'care_search');

        try {
            await this.client.getIndex(indexName);
            this.logger.log(`✅ Meilisearch index "${indexName}" is ready.`);
        } catch (error: any) {
            const errorCode = error.code || error.cause?.code;

            if (errorCode === 'index_not_found') {
                this.logger.warn(`⚠️ Index "${indexName}" not found. Creating it now...`);
                try {
                    await this.client.createIndex(indexName, { primaryKey: 'id' });
                    this.logger.log(`✅ Index "${indexName}" created successfully.`);
                } catch (createError) {
                    this.logger.error('❌ Failed to create Meilisearch index', createError);
                }
            } else {
                this.logger.error('❌ Error connecting to Meilisearch', error);
            }
        }
    }

    getIndex(indexName?: string): Index {
        const name = indexName ?? this.config.get<string>('MEILI_SEARCH_INDEX', 'care_search');
        return this.client.index(name);
    }
}