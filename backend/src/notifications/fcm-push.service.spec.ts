import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FcmPushService } from './fcm-push.service';
import { NotificationsRepository } from './notifications.repository';

const sendEachForMulticast = jest.fn();

jest.mock('firebase-admin', () => {
  const apps: unknown[] = [];
  return {
    apps,
    initializeApp: jest.fn(() => {
      apps.push({});
    }),
    credential: {
      cert: jest.fn(() => ({})),
      applicationDefault: jest.fn(() => ({})),
    },
    messaging: jest.fn(() => ({
      sendEachForMulticast,
    })),
  };
});

describe('FcmPushService', () => {
  let service: FcmPushService;
  let repository: jest.Mocked<
    Pick<
      NotificationsRepository,
      'findDeviceTokensByUserId' | 'deleteByDeviceTokens'
    >
  >;

  beforeEach(async () => {
    sendEachForMulticast.mockReset();

    repository = {
      findDeviceTokensByUserId: jest.fn(),
      deleteByDeviceTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmPushService,
        { provide: NotificationsRepository, useValue: repository },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FIREBASE_SERVICE_ACCOUNT_JSON') {
                return JSON.stringify({
                  projectId: 'test',
                  clientEmail: 'x@test.iam.gserviceaccount.com',
                  privateKey:
                    '-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n',
                });
              }
              if (key === 'PUBLIC_ORIGIN') {
                return 'http://localhost:3000';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FcmPushService>(FcmPushService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send multicast and delete invalid tokens', async () => {
    repository.findDeviceTokensByUserId.mockResolvedValue([
      { deviceToken: 'good-token' },
      { deviceToken: 'bad-token' },
    ]);
    sendEachForMulticast.mockResolvedValue({
      responses: [
        { success: true },
        {
          success: false,
          error: {
            code: 'messaging/registration-token-not-registered',
            message: 'not registered',
          },
        },
      ],
    });
    repository.deleteByDeviceTokens.mockResolvedValue({ count: 1 });

    await service.notifyProactiveAiMessage(1n, {
      chatroomId: '5',
      chatroomName: 'Room A',
      messagePreview: 'Hello world',
    });

    expect(sendEachForMulticast).toHaveBeenCalled();
    type MulticastArg = {
      tokens: string[];
      data: Record<string, string>;
      android: { priority: 'high' };
    };
    const calls = sendEachForMulticast.mock.calls as unknown as [
      MulticastArg,
    ][];
    const payload = calls[0]?.[0];
    if (!payload) {
      throw new Error('expected sendEachForMulticast payload');
    }
    expect(payload.tokens).toEqual(['good-token', 'bad-token']);
    expect(payload.android.priority).toBe('high');
    expect(payload.data.type).toBe('proactive_ai_message');
    expect(payload.data.chatroomId).toBe('5');
    expect(payload.data.title).toBe('New message in Room A');
    expect(payload.data.body).toBe('Hello world');
    expect(repository.deleteByDeviceTokens).toHaveBeenCalledWith(['bad-token']);
  });

  it('should skip when no tokens', async () => {
    repository.findDeviceTokensByUserId.mockResolvedValue([]);

    await service.notifyProactiveAiMessage(1n, { chatroomId: '1' });

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('should send formatted test notification payload', async () => {
    repository.findDeviceTokensByUserId.mockResolvedValue([
      { deviceToken: 'device-1' },
    ]);
    sendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await service.sendTestNotificationToUser({
      userId: 3n,
      chatroomId: '12',
      chatroomName: 'Focus Room',
      username: 'june',
    });

    type MulticastArg = {
      tokens: string[];
      data: Record<string, string>;
      android: { priority: 'high' };
    };
    const calls = sendEachForMulticast.mock.calls as unknown as [
      MulticastArg,
    ][];
    const payload = calls[0]?.[0];
    if (!payload) {
      throw new Error('expected sendEachForMulticast payload');
    }

    expect(payload.tokens).toEqual(['device-1']);
    expect(payload.data.title).toBe('Focus Room');
    expect(payload.data.body).toBe(
      'test notification for user june, chatroomId Focus Room',
    );
    expect(payload.data.type).toBe('test_notification');
    expect(payload.data.chatroomId).toBe('12');
    expect(payload.data.chatroomName).toBe('Focus Room');
    expect(payload.data.username).toBe('june');
  });
});
