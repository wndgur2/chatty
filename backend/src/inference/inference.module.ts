import { Module } from '@nestjs/common';
import { OllamaProviderModule } from './providers/ollama/ollama-provider.module';
import { ChatGenerationService } from './tasks/chat-generation.service';
import { ProactiveEvaluatorService } from './tasks/proactive-evaluator.service';

@Module({
  imports: [OllamaProviderModule],
  providers: [ChatGenerationService, ProactiveEvaluatorService],
  exports: [
    ChatGenerationService,
    ProactiveEvaluatorService,
    OllamaProviderModule,
  ],
})
export class InferenceModule {}
