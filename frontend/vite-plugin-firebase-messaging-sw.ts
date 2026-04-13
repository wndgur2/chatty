import type { Plugin, ResolvedConfig } from 'vite'

const SW_FILE_NAME = 'firebase-messaging-sw.js'
const FIREBASE_COMPAT_VERSION = '10.12.2'

type FirebaseEnvConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  messagingSenderId: string
  appId: string
}

function getFirebaseConfigFromEnv(config: ResolvedConfig): FirebaseEnvConfig | null {
  const apiKey = config.env.VITE_FIREBASE_API_KEY
  const authDomain = config.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = config.env.VITE_FIREBASE_PROJECT_ID
  const messagingSenderId = config.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = config.env.VITE_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
  }
}

function createServiceWorkerSource(firebaseConfig: FirebaseEnvConfig | null): string {
  const serializedConfig = JSON.stringify(firebaseConfig)

  return `/* eslint-disable no-undef */
const firebaseConfig = ${serializedConfig};

if (!firebaseConfig) {
  console.warn('[firebase-messaging-sw] Missing Firebase env config. Skipping FCM setup.');
} else {
  importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js');

  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload && payload.data ? payload.data : {};
    const notificationPart = payload && payload.notification ? payload.notification : {};

    const title = data.chatroomName || data.title || notificationPart.title || 'Chatty';
    const body = data.messagePreview || data.body || notificationPart.body || '';
    const chatroomId = typeof data.chatroomId === 'string' ? data.chatroomId.trim() : '';
    const targetUrl = chatroomId ? '/chat/' + encodeURIComponent(chatroomId) : '/';

    self.registration.showNotification(title, {
      body,
      data: { url: targetUrl },
      badge: '/favicon.svg',
    });
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification && event.notification.data ? event.notification.data : {};
    const targetPath = typeof data.url === 'string' && data.url ? data.url : '/';
    const targetUrl = new URL(targetPath, self.location.origin).href;

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
        for (const client of clientsArr) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
    );
  });
}
`
}

export function firebaseMessagingSwPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig | null = null

  const getSource = () => {
    const firebaseConfig = resolvedConfig ? getFirebaseConfigFromEnv(resolvedConfig) : null
    return createServiceWorkerSource(firebaseConfig)
  }

  return {
    name: 'firebase-messaging-sw-plugin',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith(`/${SW_FILE_NAME}`)) {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(getSource())
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: SW_FILE_NAME,
        source: getSource(),
      })
    },
  }
}
