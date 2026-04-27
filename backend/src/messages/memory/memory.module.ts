import { Module } from '@nestjs/common';
import { InferenceModule } from '../../inference/inference.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { VectorStoreModule } from '../../infrastructure/vector-store/vector-store.module';
import { MemoryService } from './memory.service';
import { SemanticChunkerService } from './semantic-chunker.service';

@Module({
  imports: [InferenceModule, VectorStoreModule, PrismaModule],
  providers: [MemoryService, SemanticChunkerService],
  exports: [MemoryService],
})
export class MemoryModule {}
