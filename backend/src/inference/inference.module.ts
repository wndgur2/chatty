import { Module } from '@nestjs/common';
import { OllamaProviderModule } from './providers/ollama/ollama-provider.module';
import { ChatGenerationService } from './tasks/chat-generation.service';
import { VoluntaryEvaluatorService } from './tasks/voluntary-evaluator.service';

@Module({
  imports: [OllamaProviderModule],
  providers: [ChatGenerationService, VoluntaryEvaluatorService],
  exports: [ChatGenerationService, VoluntaryEvaluatorService],
})
export class InferenceModule {}
