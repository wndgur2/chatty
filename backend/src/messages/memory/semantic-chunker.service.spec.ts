import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMBEDDING_PORT } from '../../inference/ports/embedding.port';
import { SemanticChunkerService } from './semantic-chunker.service';

const mockEmbeddingPort = {
  embed: jest.fn(),
  embedBatch: jest.fn(),
};

describe('SemanticChunkerService', () => {
  let service: SemanticChunkerService;
  let configOverrides: Record<string, number>;

  beforeEach(async () => {
    configOverrides = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticChunkerService,
        { provide: EMBEDDING_PORT, useValue: mockEmbeddingPort },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: number) =>
              key in configOverrides ? configOverrides[key] : fallback,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<SemanticChunkerService>(SemanticChunkerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty list for empty input', async () => {
    const chunks = await service.chunk('   ');

    expect(chunks).toEqual([]);
    expect(mockEmbeddingPort.embed).not.toHaveBeenCalled();
  });

  it('bypasses chunking for short input', async () => {
    mockEmbeddingPort.embed.mockResolvedValue([0.1, 0.2, 0.3]);

    const chunks = await service.chunk('small message');

    expect(chunks).toEqual([
      { text: 'small message', embedding: [0.1, 0.2, 0.3] },
    ]);
    expect(mockEmbeddingPort.embedBatch).not.toHaveBeenCalled();
  });

  it('splits into multiple semantic chunks for distant topics', async () => {
    const text = [
      'Project timeline and milestones are clear for the Q2 release and team communication.',
      'Engineering tasks were estimated this week with effort, risks, and dependency tracking details.',
      'I baked sourdough bread over the weekend and tracked fermentation behavior across batches.',
      'The recipe needed higher hydration, stronger steam control, and longer proofing for better oven spring.',
    ].join(' ');

    mockEmbeddingPort.embedBatch
      .mockResolvedValueOnce([
        [1, 0],
        [0.98, 0.02],
        [0.1, 0.9],
        [0.08, 0.92],
      ])
      .mockResolvedValueOnce([
        [0.95, 0.05],
        [0.09, 0.91],
      ]);

    const chunks = await service.chunk(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toContain('Project timeline');
    expect(chunks[1].text).toContain('sourdough bread');
  });

  it('keeps one chunk when sentence distances are similar', async () => {
    const text = [
      'The architecture uses modules and services to separate concerns and preserve maintainability.',
      'Controllers stay thin and delegate logic so request handling remains predictable for every endpoint.',
      'Validation runs through DTO constraints and shared guards to ensure consistency across handlers.',
      'Tests protect endpoint behavior and verify error paths under realistic service interactions.',
    ].join(' ');

    mockEmbeddingPort.embedBatch
      .mockResolvedValueOnce([
        [1, 0],
        [0.99, 0.01],
        [0.98, 0.02],
        [0.97, 0.03],
      ])
      .mockResolvedValueOnce([[0.98, 0.02]]);

    const chunks = await service.chunk(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain('modules and services');
  });

  it('applies overlap for fixed-length fallback splitting', async () => {
    configOverrides = {
      RAG_CHUNK_MIN_CHARS: 0,
      RAG_CHUNK_MIN_SENTENCES: 0,
      RAG_CHUNK_MAX_CHARS: 100,
      RAG_CHUNK_OVERLAP_CHARS: 20,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticChunkerService,
        { provide: EMBEDDING_PORT, useValue: mockEmbeddingPort },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: number) =>
              key in configOverrides ? configOverrides[key] : fallback,
            ),
          },
        },
      ],
    }).compile();
    service = module.get<SemanticChunkerService>(SemanticChunkerService);

    const longSentence = `A${'b'.repeat(140)}. B${'c'.repeat(140)}.`;
    mockEmbeddingPort.embedBatch
      .mockResolvedValueOnce([
        [1, 0],
        [1, 0],
      ])
      .mockResolvedValueOnce([
        [1, 0],
        [1, 0],
        [1, 0],
        [1, 0],
      ]);

    const chunks = await service.chunk(longSentence);

    expect(chunks).toHaveLength(4);
    expect(chunks[1].text.startsWith(chunks[0].text.slice(-20))).toBe(true);
    expect(chunks[2].text.startsWith(chunks[1].text.slice(-20))).toBe(true);
    expect(chunks[3].text.startsWith(chunks[2].text.slice(-20))).toBe(true);
  });

  it('clamps overlap when configured greater than max chars', async () => {
    configOverrides = {
      RAG_CHUNK_MIN_CHARS: 0,
      RAG_CHUNK_MIN_SENTENCES: 0,
      RAG_CHUNK_MAX_CHARS: 50,
      RAG_CHUNK_OVERLAP_CHARS: 200,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticChunkerService,
        { provide: EMBEDDING_PORT, useValue: mockEmbeddingPort },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: number) =>
              key in configOverrides ? configOverrides[key] : fallback,
            ),
          },
        },
      ],
    }).compile();
    service = module.get<SemanticChunkerService>(SemanticChunkerService);

    const longSentence = `A${'c'.repeat(90)}. B${'d'.repeat(90)}.`;
    mockEmbeddingPort.embedBatch
      .mockResolvedValueOnce([
        [1, 0],
        [1, 0],
      ])
      .mockResolvedValueOnce(new Array(136).fill([1, 0]));

    const chunks = await service.chunk(longSentence);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.text.length > 0)).toBe(true);
    expect(chunks.every((chunk) => chunk.text.length <= 50)).toBe(true);
  });
});
