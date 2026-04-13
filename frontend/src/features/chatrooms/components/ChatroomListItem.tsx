import { NavLink } from 'react-router'
import { ROUTES } from '../../../routes/paths'
import type { Chatroom } from '../../../types/api'
import { formatRelativeTime } from '../../../shared/lib/date'
import { getChatroomActivityAt } from '../../../shared/lib/chatroom'
import Avatar from '../../../shared/ui/Avatar'

export default function ChatroomListItem(room: Chatroom) {
  const displayTime = formatRelativeTime(getChatroomActivityAt(room))

  return (
    <NavLink
      to={ROUTES.CHATROOM(room.id.toString())}
      className={({ isActive }) =>
        `flex items-center gap-3 p-4 border-b transition-colors cursor-pointer rounded-lg ${
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`
      }
      style={{ borderColor: 'var(--border-color)' }}
    >
      <Avatar
        fallback={room.name[0]}
        src={room.profileImageUrl || undefined}
        className="w-10 h-10 text-lg bg-brand-100 text-brand-700"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
          <span className="text-xs text-gray-500 shrink-0">{displayTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 truncate mr-2">{room.basePrompt}</p>
        </div>
      </div>
    </NavLink>
  )
}

