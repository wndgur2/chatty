import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { UpdateChatroomDto } from './dto/update-chatroom.dto';
import { StorageService } from '../infrastructure/storage/storage.service';
import { ChatroomsRepository } from './chatrooms.repository';
import { serializeChatroom } from '../common/serializers/chatroom.serializer';

@Injectable()
export class ChatroomsService {
  constructor(
    private readonly chatroomsRepository: ChatroomsRepository,
    private readonly storageService: StorageService,
  ) {}

  async findAll(userId: string) {
    const chatrooms = await this.chatroomsRepository.findManyByUser(
      this.toUserId(userId),
    );
    return chatrooms.map(serializeChatroom);
  }

  async create(
    userId: string,
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

    const created = await this.chatroomsRepository.create({
      user: {
        connect: {
          id: this.toUserId(userId),
        },
      },
      name: dto.name,
      basePrompt: dto.basePrompt,
      profileImageUrl,
    });
    return serializeChatroom(created);
  }

  async findOne(userId: string, id: number) {
    const chatroom = await this.getOwnedChatroomOrThrow(userId, id);
    return serializeChatroom(chatroom);
  }

  async update(
    userId: string,
    id: number,
    dto: UpdateChatroomDto,
    baseUrl: string,
    file?: Express.Multer.File,
  ) {
    const chatroom = await this.getOwnedChatroomOrThrow(userId, id);

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

  async remove(userId: string, id: number) {
    const chatroom = await this.getOwnedChatroomOrThrow(userId, id);
    await this.chatroomsRepository.delete(chatroom.id);
  }

  async clone(userId: string, id: number) {
    const source = await this.getOwnedChatroomOrThrow(userId, id);
    const cloned = await this.chatroomsRepository.create({
      user: { connect: { id: source.userId } },
      name: `${source.name} (Clone)`,
      basePrompt: source.basePrompt,
      profileImageUrl: source.profileImageUrl,
    });
    return serializeChatroom(cloned);
  }

  async branch(userId: string, id: number) {
    const source = await this.getOwnedChatroomOrThrow(userId, id);

    const branched = await this.chatroomsRepository.transaction(async (tx) => {
      const newChatroom = await tx.chatroom.create({
        data: {
          userId: source.userId,
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

  private async getOwnedChatroomOrThrow(userId: string, id: number) {
    const chatroom = await this.chatroomsRepository.findByIdAndUser(
      BigInt(id),
      this.toUserId(userId),
    );
    if (!chatroom) {
      throw new NotFoundException('Chatroom not found');
    }
    return chatroom;
  }

  private toUserId(userId: string): bigint {
    return BigInt(userId);
  }
}
