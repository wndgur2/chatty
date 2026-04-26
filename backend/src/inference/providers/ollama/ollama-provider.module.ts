import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CHAT_COMPLETION_PORT } from '../../ports/chat-completion.port';
import { CLASSIFICATION_PORT } from '../../ports/classification.port';
import { EMBEDDING_PORT } from '../../ports/embedding.port';
import { ollamaClientProvider } from './ollama-client.provider';
import { OllamaChatCompletionAdapter } from './ollama-chat-completion.adapter';
import { OllamaClassificationAdapter } from './ollama-classification.adapter';
import { OllamaEmbeddingAdapter } from './ollama-embedding.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    ollamaClientProvider,
    OllamaChatCompletionAdapter,
    OllamaClassificationAdapter,
    OllamaEmbeddingAdapter,
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
  ],
  exports: [CHAT_COMPLETION_PORT, CLASSIFICATION_PORT, EMBEDDING_PORT],
})
export class OllamaProviderModule {}
