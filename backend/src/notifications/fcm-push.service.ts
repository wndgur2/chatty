import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { NotificationsRepository } from './notifications.repository';

/** FCM error codes that indicate the token should be removed from storage. */
const TOKEN_REVOKE_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

@Injectable()
export class FcmPushService implements OnModuleInit {
  private readonly logger = new Logger(FcmPushService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.messaging = admin.messaging();
      return;
    }

    const jsonEnv = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_JSON',
    );
    const adcPath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );

    try {
      if (jsonEnv) {
        const parsed = JSON.parse(jsonEnv) as ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
      } else if (adcPath) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } else {
        this.logger.warn(
          'FCM push disabled: set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.',
        );
        return;
      }
      this.messaging = admin.messaging();
      this.logger.log('Firebase Admin initialized for FCM.');
    } catch (err) {
      this.logger.error('Firebase Admin initialization failed', err);
    }
  }

  /**
   * Sends a notification with data payload FCM multicast for a proactive AI message. Clients must
   * show a user-visible notification (e.g. service worker `showNotification`,
   * Android/iOS local notification) using `data.title` and `data.body`. Use
   * `data` for routing and dedupe on `data.type`.
   */
  async notifyProactiveAiMessage(
    userId: bigint,
    payload: {
      chatroomId: string;
      chatroomName?: string;
      messagePreview?: string;
    },
  ): Promise<void> {
    const title =
      payload.chatroomName != null && payload.chatroomName.length > 0
        ? `New message in ${payload.chatroomName}`
        : 'New AI message';

    const body =
      payload.messagePreview != null && payload.messagePreview.length > 0
        ? payload.messagePreview.slice(0, 200)
        : 'Open the app to read the message.';

    const data: Record<string, string> = {
      type: 'proactive_ai_message',
      chatroomId: payload.chatroomId,
      title,
      body,
    };
    if (payload.chatroomName != null) {
      data.chatroomName = payload.chatroomName;
    }
    if (payload.messagePreview != null) {
      data.messagePreview = payload.messagePreview.slice(0, 500);
    }

    await this.sendToUserDevices(userId, { title, body, data });
  }

  async sendTestNotificationToUser(payload: {
    userId: bigint;
    chatroomId: string;
    chatroomName: string;
    username: string;
  }): Promise<void> {
    const title = payload.chatroomName;
    const body = `test notification for user ${payload.username}, chatroomId ${payload.chatroomName}`;
    const data: Record<string, string> = {
      type: 'test_notification',
      chatroomId: payload.chatroomId,
      chatroomName: payload.chatroomName,
      username: payload.username,
      title,
      body,
    };

    await this.sendToUserDevices(payload.userId, { title, body, data });
  }

  private async sendToUserDevices(
    userId: bigint,
    payload: {
      title: string;
      body: string;
      data: Record<string, string>;
    },
  ): Promise<void> {
    if (!this.messaging) {
      return;
    }

    const rows =
      await this.notificationsRepository.findDeviceTokensByUserId(userId);
    const tokens = rows.map((r) => r.deviceToken);
    if (tokens.length === 0) {
      return;
    }

    const message = {
      tokens,
      data: payload.data,
      android: { priority: 'high' as const },
    };

    this.logger.debug(`Sending FCM message to user ${userId}`);

    try {
      const result = await this.messaging.sendEachForMulticast(message);
      const invalid: string[] = [];
      result.responses.forEach((resp, index) => {
        if (resp.success) return;
        const code = resp.error?.code;
        if (code && TOKEN_REVOKE_ERROR_CODES.has(code)) {
          invalid.push(tokens[index]);
        } else if (resp.error) {
          this.logger.warn(
            `FCM send failed for token index ${index}: ${resp.error.message}`,
          );
        }
      });
      if (invalid.length > 0) {
        await this.notificationsRepository.deleteByDeviceTokens(invalid);
        this.logger.debug(`Removed ${invalid.length} invalid FCM token(s).`);
      }
    } catch (err) {
      this.logger.error('FCM sendEachForMulticast failed', err);
    }
  }
}
