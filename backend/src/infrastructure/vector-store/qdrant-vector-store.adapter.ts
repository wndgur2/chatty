import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  VectorSearchRequest,
  VectorSearchResult,
  VectorStorePort,
  type VectorPoint,
} from './vector-store.port';
import { QDRANT_CLIENT } from './qdrant-client.provider';

@Injectable()
export class QdrantVectorStoreAdapter implements VectorStorePort, OnModuleInit {
  private readonly logger = new Logger(QdrantVectorStoreAdapter.name);
  private readonly collectionName: string;
  private static readonly INTEGER_ID_PATTERN = /^\d+$/;

  constructor(
    @Inject(QDRANT_CLIENT) private readonly qdrantClient: QdrantClient,
    private readonly configService: ConfigService,
  ) {
    this.collectionName = this.configService.get<string>(
      'QDRANT_COLLECTION',
      'chat_memory',
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.qdrantClient.getCollection(this.collectionName);
    } catch {
      await this.qdrantClient.createCollection(this.collectionName, {
        vectors: { size: 384, distance: 'Cosine' },
      });
      await this.qdrantClient.createPayloadIndex(this.collectionName, {
        field_name: 'chatroomId',
        field_schema: 'integer',
      });
      this.logger.log(`Created Qdrant collection: ${this.collectionName}`);
    }
  }

  async upsert(point: VectorPoint): Promise<void> {
    const normalizedId = this.normalizePointId(point.id);
    await this.qdrantClient.upsert(this.collectionName, {
      wait: false,
      points: [{ ...point, id: normalizedId }],
    });
  }

  async search(req: VectorSearchRequest): Promise<VectorSearchResult[]> {
    const results = await this.qdrantClient.search(this.collectionName, {
      vector: req.vector,
      limit: req.limit,
      score_threshold: req.minScore,
      with_payload: true,
      filter: {
        must: [{ key: 'chatroomId', match: { value: req.chatroomId } }],
        must_not:
          req.excludeMessageIds && req.excludeMessageIds.length > 0
            ? [{ key: 'messageId', match: { any: req.excludeMessageIds } }]
            : undefined,
      },
    });

    return results
      .filter((result) => result.payload != null)
      .map((result) => ({
        id: String(result.id),
        score: result.score ?? 0,
        payload: result.payload as VectorSearchResult['payload'],
      }));
  }

  async hasPoint(id: string): Promise<boolean> {
    const normalizedId = this.normalizePointId(id);
    const points = await this.qdrantClient.retrieve(this.collectionName, {
      ids: [normalizedId],
      with_payload: false,
      with_vector: false,
    });
    return points.length > 0;
  }

  async deleteByChatroom(chatroomId: number): Promise<void> {
    try {
      await this.qdrantClient.delete(this.collectionName, {
        wait: false,
        filter: {
          must: [{ key: 'chatroomId', match: { value: chatroomId } }],
        },
      });
    } catch (error) {
      this.logger.error('Failed to delete vectors by chatroom', error);
      throw new ServiceUnavailableException('Vector store delete failed');
    }
  }

  private normalizePointId(id: string): string | number {
    if (QdrantVectorStoreAdapter.INTEGER_ID_PATTERN.test(id)) {
      return Number(id);
    }
    return id;
  }
}
