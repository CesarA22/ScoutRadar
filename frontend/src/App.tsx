import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { FilterProvider } from './hooks/useFilters'
import './i18n'
import { ChatPage } from './pages/ChatPage'
import { ComparePage } from './pages/ComparePage'
import { ExplorerPage } from './pages/ExplorerPage'
import { OutliersPage } from './pages/OutliersPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/explorer" replace />} />
              <Route path="explorer" element={<ExplorerPage />} />
              <Route path="outliers" element={<OutliersPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FilterProvider>
    </QueryClientProvider>
  )
}
