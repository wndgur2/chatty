import { useParams } from 'react-router'
import ChatroomScreen from '../features/chatroom/components/ChatroomScreen'

export default function ChatroomPage() {
  const { id } = useParams<{ id: string }>()
  const chatroomId = Number(id)

  return <ChatroomScreen chatroomId={chatroomId} />
}
