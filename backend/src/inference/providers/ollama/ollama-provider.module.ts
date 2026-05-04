import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CHAT_COMPLETION_PORT } from '../../ports/chat-completion.port';
import { EMBEDDING_PORT } from '../../ports/embedding.port';
import { MEMORY_EXTRACTION_PORT } from '../../ports/memory-extraction.port';
import { PROACTIVE_MESSAGE_EVALUATION_PORT } from '../../ports/proactive-message-evaluation.port';
import { STRUCTURED_OUTPUT_PORT } from '../../shared/structured-output.port';
import { ollamaClientProvider } from './ollama-client.provider';
import { OllamaChatCompletionAdapter } from './ollama-chat-completion.adapter';
import { OllamaEmbeddingAdapter } from './ollama-embedding.adapter';
import { OllamaMemoryExtractionAdapter } from './ollama-memory-extraction.adapter';
import { OllamaProactiveMessageEvaluationAdapter } from './ollama-proactive-message-evaluation.adapter';
import { OllamaStructuredOutputAdapter } from './ollama-structured-output.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    ollamaClientProvider,
    OllamaChatCompletionAdapter,
    OllamaEmbeddingAdapter,
    OllamaStructuredOutputAdapter,
    OllamaProactiveMessageEvaluationAdapter,
    OllamaMemoryExtractionAdapter,
    {
      provide: CHAT_COMPLETION_PORT,
      useExisting: OllamaChatCompletionAdapter,
    },
    {
      provide: EMBEDDING_PORT,
      useExisting: OllamaEmbeddingAdapter,
    },
    {
      provide: STRUCTURED_OUTPUT_PORT,
      useExisting: OllamaStructuredOutputAdapter,
    },
    {
      provide: PROACTIVE_MESSAGE_EVALUATION_PORT,
      useExisting: OllamaProactiveMessageEvaluationAdapter,
    },
    {
      provide: MEMORY_EXTRACTION_PORT,
      useExisting: OllamaMemoryExtractionAdapter,
    },
  ],
  exports: [
    CHAT_COMPLETION_PORT,
    EMBEDDING_PORT,
    STRUCTURED_OUTPUT_PORT,
    PROACTIVE_MESSAGE_EVALUATION_PORT,
    MEMORY_EXTRACTION_PORT,
  ],
})
export class OllamaProviderModule {}
