import { Module } from '@nestjs/common';
import { InferenceModule } from '../../inference/inference.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { VectorStoreModule } from '../../infrastructure/vector-store/vector-store.module';
import { MemoryService } from './memory.service';

@Module({
  imports: [InferenceModule, VectorStoreModule, PrismaModule],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
