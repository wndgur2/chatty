import { createBrowserRouter } from 'react-router'
import RootLayout from '../app/RootLayout'
import DefaultLayout from '../layout/DefaultLayout'
import HomePage from '../pages/HomePage'
import ChatroomPage from '../pages/ChatroomPage'
import { ROUTES } from './paths'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: ROUTES.HOME,
        element: <DefaultLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: ROUTES.CHATROOM(':id'), element: <ChatroomPage /> },
          { path: '*', element: <div>Not Found</div> },
        ],
      },
    ],
  },
])
