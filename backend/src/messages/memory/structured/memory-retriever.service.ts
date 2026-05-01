import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRUCTURED_STATE_PROMPT } from '../../../inference/prompts/chat-system.prompt';
import { ChatroomFactRepository } from './chatroom-fact.repository';

@Injectable()
export class MemoryRetrieverService {
  private readonly minConfidence: number;

  constructor(
    private readonly chatroomFactRepository: ChatroomFactRepository,
    private readonly configService: ConfigService,
  ) {
    this.minConfidence = Number(
      this.configService.get('MEMORY_RETRIEVER_MIN_CONFIDENCE', 0.5),
    );
  }

  async getStateBlock(chatroomId: number): Promise<string> {
    const facts = await this.chatroomFactRepository.findAllForChatroom(chatroomId, {
      minConfidence: this.minConfidence,
    });

    if (facts.length === 0) {
      return '';
    }

    const lines = facts.map((fact) => {
      const serialized = JSON.stringify(fact.value);
      return `- ${fact.key}: ${serialized}`;
    });

    return `${STRUCTURED_STATE_PROMPT}\n${lines.join('\n')}`;
  }
}
