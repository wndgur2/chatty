import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export const QDRANT_CLIENT = Symbol('QdrantClient');

export const qdrantClientProvider: Provider = {
  provide: QDRANT_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    new QdrantClient({
      url: configService.get<string>('QDRANT_URL', 'http://127.0.0.1:6333'),
    }),
};
