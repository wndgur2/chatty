/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { BigIntSerializerInterceptor } from '../src/common/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MessagesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdChatroomId: number;
  let accessToken: string;
  let authUserId: bigint;

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
      .send({ username: 'testuser_messages' })
      .expect(201);
    accessToken = loginRes.body.accessToken as string;
    authUserId = BigInt(loginRes.body.user.id as string);

    // Ensure a chatroom exists for this test
    const chatroom = await prisma.chatroom.create({
      data: {
        userId: authUserId,
        name: 'Message E2E Chatroom',
      },
    });
    createdChatroomId = Number(chatroom.id);
  });

  afterAll(async () => {
    // Delete the chatroom, tearing down messages synchronously
    // Intentionally commented out to let rows insert into the actual database for inspection.
    // await prisma.chatroom.delete({
    //   where: { id: BigInt(createdChatroomId) },
    // });
    await app.close();
  });

  it('/api/chatrooms/:id/messages (POST) - send message (C)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/chatrooms/${createdChatroomId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Hello AI' })
      .expect(202);

    expect(res.body.status).toBe('processing');
    expect(res.body.messageId).toBeDefined();
    expect(res.body.message).toMatchObject({
      sender: 'user',
      content: 'Hello AI',
    });
    expect(res.body.message.id).toBe(res.body.messageId);

    // Validate database insertion directly
    const dbRecord = await prisma.message.findFirst({
      where: { chatroomId: BigInt(createdChatroomId), sender: 'user' },
    });

    expect(dbRecord).toBeTruthy();
    expect(dbRecord?.content).toBe('Hello AI');
  });

  it('/api/chatrooms/:id/messages (GET) - retrieve history (R)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/chatrooms/${createdChatroomId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const match = res.body.find((m: any) => m.content === 'Hello AI');
    expect(match).toBeDefined();
    expect(match.sender).toBe('user');
  });
});
