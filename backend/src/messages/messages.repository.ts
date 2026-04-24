import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Sender, type AiMessageDeliveryMode } from '@prisma/client';

type CreateAiMessageMetadataInput = {
  readAt?: Date | null;
  deliveryMode: AiMessageDeliveryMode;
  triggerReason: string;
  triggerContext?: Prisma.InputJsonValue | null;
};

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findHistory(chatroomId: bigint, limit: number, offset: number) {
    return this.prisma.message.findMany({
      where: { chatroomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  findRecent(chatroomId: bigint, take: number) {
    return this.prisma.message.findMany({
      where: { chatroomId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  createMessage(
    chatroomId: bigint,
    sender: Sender,
    content: string,
    aiMetadata?: CreateAiMessageMetadataInput,
  ) {
    return this.prisma.message.create({
      data: {
        chatroom: { connect: { id: chatroomId } },
        sender,
        content,
        aiMessageMetadata:
          sender === 'ai' && aiMetadata
            ? {
                create: {
                  readAt: aiMetadata.readAt ?? null,
                  deliveryMode: aiMetadata.deliveryMode,
                  triggerReason: aiMetadata.triggerReason,
                  ...(aiMetadata.triggerContext != null
                    ? { triggerContext: aiMetadata.triggerContext }
                    : {}),
                },
              }
            : undefined,
      },
    });
  }
}
