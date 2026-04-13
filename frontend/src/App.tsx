import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes/router'
import { queryClient } from './app/providers/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full min-h-0">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  )
}

export default App
