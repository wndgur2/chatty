import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChatroomsController } from './chatrooms.controller';
import { ChatroomsService } from './chatrooms.service';
import { Readable } from 'stream';

const mockChatroomsService = {
  findAll: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  clone: jest.fn(),
  branch: jest.fn(),
};

describe('ChatroomsController', () => {
  let controller: ChatroomsController;
  const authUser = { userId: '1' };
  const mockConfigService = {
    get: jest.fn(),
  };
  const mockRequest = {
    protocol: 'http',
    get: () => 'localhost:8080',
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatroomsController],
      providers: [
        {
          provide: ChatroomsService,
          useValue: mockChatroomsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ChatroomsController>(ChatroomsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return an array of chatrooms', async () => {
    const result = [{ id: 1, name: 'General Chat' }];
    mockChatroomsService.findAll.mockResolvedValue(result);

    expect(await controller.findAll(authUser)).toBe(result);
    expect(mockChatroomsService.findAll).toHaveBeenCalledWith(authUser.userId);
  });

  it('should create a chatroom', async () => {
    mockConfigService.get.mockReturnValue(undefined);
    const dto = { name: 'New Chat', basePrompt: 'Prompt' };

    const file: Express.Multer.File = {
      buffer: Buffer.from(''),
      fieldname: 'profileImage',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 0,
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };
    const result = { id: 2, ...dto };
    mockChatroomsService.create.mockResolvedValue(result);

    expect(await controller.create(authUser, dto, file, mockRequest)).toBe(
      result,
    );
    expect(mockChatroomsService.create).toHaveBeenCalledWith(
      authUser.userId,
      dto,
      'http://localhost:8080',
      file,
    );
  });

  it('should use PUBLIC_ORIGIN when creating a chatroom', async () => {
    mockConfigService.get.mockReturnValue('http://localhost:8080');
    const dto = { name: 'New Chat', basePrompt: 'Prompt' };
    const file: Express.Multer.File = {
      buffer: Buffer.from(''),
      fieldname: 'profileImage',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 0,
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };
    const result = { id: 2, ...dto };
    mockChatroomsService.create.mockResolvedValue(result);

    await controller.create(authUser, dto, file, mockRequest);

    expect(mockChatroomsService.create).toHaveBeenCalledWith(
      authUser.userId,
      dto,
      'http://localhost:8080',
      file,
    );
  });

  it('should return a single chatroom by id', async () => {
    const result = { id: 1, name: 'General Chat' };
    mockChatroomsService.findOne.mockResolvedValue(result);

    expect(await controller.findOne(authUser, 1)).toBe(result);
    expect(mockChatroomsService.findOne).toHaveBeenCalledWith(
      authUser.userId,
      1,
    );
  });

  it('should update a chatroom', async () => {
    mockConfigService.get.mockReturnValue(undefined);
    const dto = { basePrompt: 'New Prompt' };

    const file: Express.Multer.File = {
      buffer: Buffer.from(''),
      fieldname: 'profileImage',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 0,
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };
    const result = { id: 1, ...dto };
    mockChatroomsService.update.mockResolvedValue(result);

    expect(await controller.update(authUser, 1, dto, file, mockRequest)).toBe(
      result,
    );
    expect(mockChatroomsService.update).toHaveBeenCalledWith(
      authUser.userId,
      1,
      dto,
      'http://localhost:8080',
      file,
    );
  });

  it('should use PUBLIC_ORIGIN when updating a chatroom', async () => {
    mockConfigService.get.mockReturnValue('https://chatty.example.com');
    const dto = { basePrompt: 'New Prompt' };
    const file: Express.Multer.File = {
      buffer: Buffer.from(''),
      fieldname: 'profileImage',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 0,
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };
    const result = { id: 1, ...dto };
    mockChatroomsService.update.mockResolvedValue(result);

    await controller.update(authUser, 1, dto, file, mockRequest);

    expect(mockChatroomsService.update).toHaveBeenCalledWith(
      authUser.userId,
      1,
      dto,
      'https://chatty.example.com',
      file,
    );
  });

  it('should delete a chatroom', async () => {
    mockChatroomsService.remove.mockResolvedValue(undefined);

    await controller.remove(authUser, 1);
    expect(mockChatroomsService.remove).toHaveBeenCalledWith(
      authUser.userId,
      1,
    );
  });

  it('should clone a chatroom', async () => {
    const result = { id: 3, name: 'Clone' };
    mockChatroomsService.clone.mockResolvedValue(result);

    expect(await controller.clone(authUser, 1)).toBe(result);
    expect(mockChatroomsService.clone).toHaveBeenCalledWith(authUser.userId, 1);
  });

  it('should branch a chatroom', async () => {
    const result = { id: 4, name: 'Branch' };
    mockChatroomsService.branch.mockResolvedValue(result);

    expect(await controller.branch(authUser, 1)).toBe(result);
    expect(mockChatroomsService.branch).toHaveBeenCalledWith(
      authUser.userId,
      1,
    );
  });
});
