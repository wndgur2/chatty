import { Module } from '@nestjs/common';
import { OllamaProviderModule } from './providers/ollama/ollama-provider.module';
import { ChatGenerationService } from './tasks/chat-generation.service';
import { ProactiveEvaluatorService } from './tasks/proactive-evaluator.service';
import { CHAT_COMPLETION_PORT } from './ports/chat-completion.port';
import { EMBEDDING_PORT } from './ports/embedding.port';
import { PROACTIVE_MESSAGE_EVALUATION_PORT } from './ports/proactive-message-evaluation.port';
import { MEMORY_EXTRACTION_PORT } from './ports/memory-extraction.port';
import { STRUCTURED_OUTPUT_PORT } from './shared/structured-output.port';

@Module({
  imports: [OllamaProviderModule],
  providers: [ChatGenerationService, ProactiveEvaluatorService],
  exports: [
    ChatGenerationService,
    ProactiveEvaluatorService,
    OllamaProviderModule,
    CHAT_COMPLETION_PORT,
    EMBEDDING_PORT,
    PROACTIVE_MESSAGE_EVALUATION_PORT,
    MEMORY_EXTRACTION_PORT,
    STRUCTURED_OUTPUT_PORT,
  ],
})
export class InferenceModule {}
