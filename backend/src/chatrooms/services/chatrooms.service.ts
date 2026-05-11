import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChatroomDto } from '../dto/create-chatroom.dto';
import { UpdateChatroomDto } from '../dto/update-chatroom.dto';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { ChatroomsRepository } from '../repositories/chatrooms.repository';
import { serializeChatroom } from '../../common/serializers/chatroom.serializer';
import type { OwnerScope } from '../../auth/utils/owner-scope.util';

@Injectable()
export class ChatroomsService {
  constructor(
    private readonly chatroomsRepository: ChatroomsRepository,
    private readonly storageService: StorageService,
  ) {}

  async findAll(scope: OwnerScope) {
    const chatrooms = await this.chatroomsRepository.findManyByOwner(scope);
    return chatrooms.map(serializeChatroom);
  }

  async create(
    scope: OwnerScope,
    dto: CreateChatroomDto,
    baseUrl: string,
    file?: Express.Multer.File,
  ) {
    let profileImageUrl: string | null = null;
    if (file) {
      profileImageUrl = await this.storageService.saveProfileImage(
        file,
        baseUrl,
      );
    }

    const ownerConnect =
      scope.kind === 'user'
        ? { user: { connect: { id: scope.userId } } }
        : { guestSession: { connect: { id: scope.guestSessionId } } };

    const created = await this.chatroomsRepository.create({
      ...ownerConnect,
      name: dto.name,
      basePrompt: dto.basePrompt,
      profileImageUrl,
    });
    return serializeChatroom(created);
  }

  async findOne(scope: OwnerScope, id: number) {
    const chatroom = await this.getOwnedChatroomOrThrow(scope, id);
    return serializeChatroom(chatroom);
  }

  async update(
    scope: OwnerScope,
    id: number,
    dto: UpdateChatroomDto,
    baseUrl: string,
    file?: Express.Multer.File,
  ) {
    const chatroom = await this.getOwnedChatroomOrThrow(scope, id);

    let profileImageUrl = chatroom.profileImageUrl;
    if (file) {
      profileImageUrl = await this.storageService.saveProfileImage(
        file,
        baseUrl,
      );
    }
    const updated = await this.chatroomsRepository.update(chatroom.id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.basePrompt && { basePrompt: dto.basePrompt }),
      profileImageUrl,
    });
    return serializeChatroom(updated);
  }

  async remove(scope: OwnerScope, id: number) {
    const chatroom = await this.getOwnedChatroomOrThrow(scope, id);
    await this.chatroomsRepository.delete(chatroom.id);
  }

  async clone(scope: OwnerScope, id: number) {
    const source = await this.getOwnedChatroomOrThrow(scope, id);
    const ownerData =
      source.userId !== null
        ? { user: { connect: { id: source.userId } } }
        : {
            guestSession: {
              connect: { id: source.guestSessionId as string },
            },
          };
    const cloned = await this.chatroomsRepository.create({
      ...ownerData,
      name: `${source.name} (Clone)`,
      basePrompt: source.basePrompt,
      profileImageUrl: source.profileImageUrl,
    });
    return serializeChatroom(cloned);
  }

  async branch(scope: OwnerScope, id: number) {
    const source = await this.getOwnedChatroomOrThrow(scope, id);

    const branched = await this.chatroomsRepository.transaction(async (tx) => {
      const newChatroom = await tx.chatroom.create({
        data: {
          userId: source.userId,
          guestSessionId: source.guestSessionId,
          name: `${source.name} (Branch)`,
          basePrompt: source.basePrompt,
          profileImageUrl: source.profileImageUrl,
        },
      });

      const messages = await tx.message.findMany({
        where: { chatroomId: source.id },
      });

      if (messages.length > 0) {
        await tx.message.createMany({
          data: messages.map((m) => ({
            chatroomId: newChatroom.id,
            sender: m.sender,
            content: m.content,
            createdAt: m.createdAt,
          })),
        });
      }

      return newChatroom;
    });
    return serializeChatroom(branched);
  }

  private async getOwnedChatroomOrThrow(scope: OwnerScope, id: number) {
    const chatroom = await this.chatroomsRepository.findByIdAndOwner(
      BigInt(id),
      scope,
    );
    if (!chatroom) {
      throw new NotFoundException('Chatroom not found');
    }
    return chatroom;
  }
}
