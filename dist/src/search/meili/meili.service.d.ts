import { OnModuleInit } from '@nestjs/common';
import type { Index, Meilisearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
export declare class MeiliService implements OnModuleInit {
    readonly client: Meilisearch;
    private readonly config;
    private readonly logger;
    constructor(client: Meilisearch, config: ConfigService);
    onModuleInit(): Promise<void>;
    getIndex(indexName?: string): Index;
}
