import { Global, Module } from '@nestjs/common';
import { MeiliService } from './meili/meili.service';
import { MeiliClientProvider } from './meili/meili.client';
import { CareSearchService } from './indexes/care-search.service';
import { CareSearchIndexer } from './indexes/care-search.indexer';
import { PrismaService } from 'prisma/prisma.service';

@Global()
@Module({
    providers: [
        MeiliClientProvider,
        MeiliService,
        CareSearchService,
        CareSearchIndexer,
        PrismaService,
    ],
    exports: [MeiliService, CareSearchService, CareSearchIndexer],
})
export class SearchModule { }