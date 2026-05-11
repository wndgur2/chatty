# Component inventory

Canonical UI building blocks and where they live under `frontend/src/features/`. Extend this table when adding user-visible components.

| Area | Component / hook | Path | Notes |
|------|-------------------|------|--------|
| Auth | `LoginModal` | `auth/components/LoginModal.tsx` | Credential / guest entry |
| Chatrooms list | `SideBar` | `chatrooms/components/SideBar.tsx` | Shell + list |
| Chatrooms list | `ChatroomListItem` | `chatrooms/components/ChatroomListItem.tsx` | Row, selection |
| Chatrooms list | `ChatroomConfiguration` | `chatrooms/components/ChatroomConfiguration.tsx` | Room settings in sidebar |
| Chatrooms | `CreateChatroomModal` | `chatrooms/components/CreateChatroomModal.tsx` | Create flow |
| Chatroom | `ChatroomScreen` | `chatroom/components/ChatroomScreen.tsx` | Main chat view |
| Chatroom | `MessageList` | `chatroom/components/MessageList.tsx` | Scrollable history |
| Chatroom | `ChatBubble` | `chatroom/components/ChatBubble.tsx` | Message chrome |
| Chatroom | `Composer` | `chatroom/components/Composer.tsx` | Input + send |
| Chatroom | `AiMarkdownContent` | `chatroom/components/AiMarkdownContent.tsx` | Rendered AI body |
| Chatroom | `EditChatroomModal` | `chatroom/components/EditChatroomModal.tsx` | Edit room meta |
| Chatroom | `InferIndicator` | `chatroom/components/InferIndicator.tsx` | Typing / inference UI |
| Notifications | `PushNotificationButton` | `notifications/components/PushNotificationButton.tsx` | Opt-in push |
| Notifications | `SendTestNotificationButton` | `notifications/components/SendTestNotificationButton.tsx` | Dev/test |
| Notifications | `ForegroundNotificationPopup` | `notifications/components/ForegroundNotificationPopup.tsx` | In-app toast |

Shared API/types: `frontend/src/api/`, `frontend/src/types/`.
