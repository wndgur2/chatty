/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { BigIntSerializerInterceptor } from '../src/common/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ChatroomsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdChatroomId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();

    prisma = app.get(PrismaService);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser_chatrooms' })
      .expect(201);
    accessToken = loginRes.body.accessToken as string;
  });

  afterAll(async () => {
    // Intentionally leaving 'where: { userId: 1n }' records in the database so they can be inspected.
    // await prisma.chatroom.deleteMany({
    //   where: { userId: 1n },
    // });
    await app.close();
  });

  it('/api/chatrooms (POST) - create a chatroom', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chatrooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'E2E Chatroom')
      .field('basePrompt', 'You are an e2e test bot.');

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('E2E Chatroom');

    const dbRecord = await prisma.chatroom.findFirst({
      where: { name: 'E2E Chatroom' },
    });

    expect(dbRecord).toBeTruthy();
    expect(dbRecord?.basePrompt).toBe('You are an e2e test bot.');

    createdChatroomId = res.body.id;
  });

  it('/api/chatrooms (GET) - list chatrooms', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/chatrooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const result = res.body.find((c: any) => c.id === createdChatroomId);
    expect(result).toBeDefined();
    expect(result.name).toBe('E2E Chatroom');
  });

  it('/api/chatrooms/:id (GET) - read one chatroom', async () => {
    const res = await request(app.getHttpServer())
      .set('Authorization', `Bearer ${accessToken}`)
      .get(`/api/chatrooms/${createdChatroomId}`)
      .expect(200);

    expect(res.body.id).toBe(createdChatroomId);
    expect(res.body.name).toBe('E2E Chatroom');
  });

  it('/api/chatrooms/:id (PATCH) - update chatroom', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/chatrooms/${createdChatroomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'Updated E2E Chatroom')
      .expect(200);

    expect(res.body.name).toBe('Updated E2E Chatroom');

    const dbRecord = await prisma.chatroom.findUnique({
      where: { id: BigInt(createdChatroomId) },
    });
    expect(dbRecord?.name).toBe('Updated E2E Chatroom');
  });

  it('/api/chatrooms/:id (DELETE) - delete chatroom', async () => {
    await request(app.getHttpServer())
      .delete(`/api/chatrooms/${createdChatroomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const dbRecord = await prisma.chatroom.findUnique({
      where: { id: BigInt(createdChatroomId) },
    });
    expect(dbRecord).toBeNull();
  });
});
