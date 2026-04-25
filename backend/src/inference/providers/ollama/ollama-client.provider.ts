import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';

export const OLLAMA_CLIENT = Symbol('OllamaClient');

export const ollamaClientProvider: Provider = {
  provide: OLLAMA_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    new Ollama({
      host: configService.get<string>('OLLAMA_HOST', 'http://127.0.0.1:11434'),
    }),
};
