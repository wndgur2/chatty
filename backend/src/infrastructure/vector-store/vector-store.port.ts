export const VECTOR_STORE_PORT = Symbol('VectorStorePort');

export type VectorPointPayload = {
  chatroomId: number;
  userId: string;
  messageId: string;
  memoryType?: 'semantic' | 'episodic';
  memoryRecordId?: string;
  memoryLabel?: string;
  chunkIndex: number;
  chunkCount: number;
  createdAt: string;
  sender: 'user' | 'ai';
  content: string;
};

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: VectorPointPayload;
};

export type VectorSearchRequest = {
  vector: number[];
  limit: number;
  minScore?: number;
  chatroomId: number;
  memoryType?: 'semantic' | 'episodic';
  excludeMessageIds?: string[];
};

export type VectorSearchResult = {
  id: string;
  score: number;
  payload: VectorPointPayload;
};

export interface VectorStorePort {
  upsert(point: VectorPoint): Promise<void>;
  search(req: VectorSearchRequest): Promise<VectorSearchResult[]>;
  hasPoint(id: string): Promise<boolean>;
  hasPointsForMessage(
    messageId: string,
    memoryType?: 'semantic' | 'episodic',
  ): Promise<boolean>;
  deleteByChatroom(chatroomId: number): Promise<void>;
}
