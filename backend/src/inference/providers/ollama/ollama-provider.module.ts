import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CHAT_COMPLETION_PORT } from '../../ports/chat-completion.port';
import { CLASSIFICATION_PORT } from '../../ports/classification.port';
import { EMBEDDING_PORT } from '../../ports/embedding.port';
import { STRUCTURED_OUTPUT_PORT } from '../../ports/structured-output.port';
import { ollamaClientProvider } from './ollama-client.provider';
import { OllamaChatCompletionAdapter } from './ollama-chat-completion.adapter';
import { OllamaClassificationAdapter } from './ollama-classification.adapter';
import { OllamaEmbeddingAdapter } from './ollama-embedding.adapter';
import { OllamaStructuredOutputAdapter } from './ollama-structured-output.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    ollamaClientProvider,
    OllamaChatCompletionAdapter,
    OllamaClassificationAdapter,
    OllamaEmbeddingAdapter,
    OllamaStructuredOutputAdapter,
    {
      provide: CHAT_COMPLETION_PORT,
      useExisting: OllamaChatCompletionAdapter,
    },
    {
      provide: CLASSIFICATION_PORT,
      useExisting: OllamaClassificationAdapter,
    },
    {
      provide: EMBEDDING_PORT,
      useExisting: OllamaEmbeddingAdapter,
    },
    {
      provide: STRUCTURED_OUTPUT_PORT,
      useExisting: OllamaStructuredOutputAdapter,
    },
  ],
  exports: [
    CHAT_COMPLETION_PORT,
    CLASSIFICATION_PORT,
    EMBEDDING_PORT,
    STRUCTURED_OUTPUT_PORT,
  ],
})
export class OllamaProviderModule {}
