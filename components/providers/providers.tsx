'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type State } from 'wagmi'
import { type ReactNode } from 'react'
import { wagmiConfig } from '@/lib/wagmi.config'
import { Toaster } from '@/components/ui/sonner'

// Set up queryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Providers Component
 * Wraps the app with wagmi and React Query providers
 * Provides Web3 functionality throughout the application
 */
export function Providers({ 
  children, 
  initialState 
}: { 
  children: ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

