import { Module } from '@nestjs/common';
import { InferenceModule } from '../../inference/inference.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { VectorStoreModule } from '../../infrastructure/vector-store/vector-store.module';
import { MemoryService } from './memory.service';
import { SemanticChunkerService } from './semantic-chunker.service';
import { ChatroomFactRepository } from './structured/chatroom-fact.repository';
import { MemoryExtractorService } from './structured/memory-extractor.service';
import { MemoryRetrieverService } from './structured/memory-retriever.service';

@Module({
  imports: [InferenceModule, VectorStoreModule, PrismaModule],
  providers: [
    MemoryService,
    SemanticChunkerService,
    ChatroomFactRepository,
    MemoryExtractorService,
    MemoryRetrieverService,
  ],
  exports: [
    MemoryService,
    ChatroomFactRepository,
    MemoryExtractorService,
    MemoryRetrieverService,
  ],
})
export class MemoryModule {}
