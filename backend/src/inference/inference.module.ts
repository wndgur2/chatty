import { Module } from '@nestjs/common';
import { OllamaProviderModule } from './providers/ollama/ollama-provider.module';
import { ChatGenerationService } from './tasks/chat-generation.service';
import { ProactiveEvaluatorService } from './tasks/proactive-evaluator.service';
import { STRUCTURED_OUTPUT_PORT } from './ports/structured-output.port';

@Module({
  imports: [OllamaProviderModule],
  providers: [ChatGenerationService, ProactiveEvaluatorService],
  exports: [
    ChatGenerationService,
    ProactiveEvaluatorService,
    OllamaProviderModule,
    STRUCTURED_OUTPUT_PORT,
  ],
})
export class InferenceModule {}
