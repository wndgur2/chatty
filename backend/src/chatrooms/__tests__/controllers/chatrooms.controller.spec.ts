import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChatroomsController } from '../../controllers/chatrooms.controller';
import { ChatroomsService } from '../../services/chatrooms.service';
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
  const authPrincipal = { mode: 'user' as const, userId: '1' };
  const userScope = { kind: 'user' as const, userId: 1n };
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

    expect(await controller.findAll(authPrincipal)).toBe(result);
    expect(mockChatroomsService.findAll).toHaveBeenCalledWith(userScope);
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

    expect(await controller.create(authPrincipal, dto, file, mockRequest)).toBe(
      result,
    );
    expect(mockChatroomsService.create).toHaveBeenCalledWith(
      userScope,
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

    await controller.create(authPrincipal, dto, file, mockRequest);

    expect(mockChatroomsService.create).toHaveBeenCalledWith(
      userScope,
      dto,
      'http://localhost:8080',
      file,
    );
  });

  it('should return a single chatroom by id', async () => {
    const result = { id: 1, name: 'General Chat' };
    mockChatroomsService.findOne.mockResolvedValue(result);

    expect(await controller.findOne(authPrincipal, 1)).toBe(result);
    expect(mockChatroomsService.findOne).toHaveBeenCalledWith(userScope, 1);
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

    expect(
      await controller.update(authPrincipal, 1, dto, file, mockRequest),
    ).toBe(result);
    expect(mockChatroomsService.update).toHaveBeenCalledWith(
      userScope,
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

    await controller.update(authPrincipal, 1, dto, file, mockRequest);

    expect(mockChatroomsService.update).toHaveBeenCalledWith(
      userScope,
      1,
      dto,
      'https://chatty.example.com',
      file,
    );
  });

  it('should delete a chatroom', async () => {
    mockChatroomsService.remove.mockResolvedValue(undefined);

    await controller.remove(authPrincipal, 1);
    expect(mockChatroomsService.remove).toHaveBeenCalledWith(userScope, 1);
  });

  it('should clone a chatroom', async () => {
    const result = { id: 3, name: 'Clone' };
    mockChatroomsService.clone.mockResolvedValue(result);

    expect(await controller.clone(authPrincipal, 1)).toBe(result);
    expect(mockChatroomsService.clone).toHaveBeenCalledWith(userScope, 1);
  });

  it('should branch a chatroom', async () => {
    const result = { id: 4, name: 'Branch' };
    mockChatroomsService.branch.mockResolvedValue(result);

    expect(await controller.branch(authPrincipal, 1)).toBe(result);
    expect(mockChatroomsService.branch).toHaveBeenCalledWith(userScope, 1);
  });
});
