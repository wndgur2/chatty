import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { qdrantClientProvider } from './qdrant-client.provider';
import { QdrantVectorStoreAdapter } from './qdrant-vector-store.adapter';
import { VECTOR_STORE_PORT } from './vector-store.port';

@Module({
  imports: [ConfigModule],
  providers: [
    qdrantClientProvider,
    QdrantVectorStoreAdapter,
    {
      provide: VECTOR_STORE_PORT,
      useExisting: QdrantVectorStoreAdapter,
    },
  ],
  exports: [VECTOR_STORE_PORT],
})
export class VectorStoreModule {}
