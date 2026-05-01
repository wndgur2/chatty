import { Module } from '@nestjs/common';
import { InferenceModule } from '../../inference/inference.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { VectorStoreModule } from '../../infrastructure/vector-store/vector-store.module';
import { CoreStateMemoryService } from './core-state-memory.service';
import { EpisodicMemoryService } from './episodic-memory.service';
import { MemoryExtractorAgentService } from './memory-extractor.agent.service';
import { MemoryRetrieverAgentService } from './memory-retriever.agent.service';
import { MemoryService } from './memory.service';
import { SemanticChunkerService } from './semantic-chunker.service';
import { SemanticMemoryService } from './semantic-memory.service';

@Module({
  imports: [InferenceModule, VectorStoreModule, PrismaModule],
  providers: [
    MemoryService,
    MemoryExtractorAgentService,
    MemoryRetrieverAgentService,
    SemanticChunkerService,
    SemanticMemoryService,
    EpisodicMemoryService,
    CoreStateMemoryService,
  ],
  exports: [MemoryService],
})
export class MemoryModule {}
