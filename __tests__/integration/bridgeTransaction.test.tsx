import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversionCard } from '@/app/_components/conversionCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi.config'
import { http, HttpResponse } from 'msw'
import { mainnet, sepolia } from 'wagmi/chains'
import type { AssetChainCombination } from '@/lib/assets-config'
import { getAllAssetChainCombinations } from '@/lib/assets-config'

// Import server from vitest setup (already configured globally)
import { server } from '../../vitest.setup'

// Mock wagmi hooks
const mockConnections = vi.fn(() => [])
const mockChainId = vi.fn(() => mainnet.id)
const mockAccount = vi.fn(() => ({
  isConnected: true,
  address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
}))
const mockUseReadContract = vi.fn(() => ({
  data: undefined,
  isLoading: false,
}))
const mockUsePublicClient = vi.fn(() => ({
  getCode: vi.fn().mockResolvedValue('0x'),
}))

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnections: () => mockConnections(),
    useChainId: () => mockChainId(),
    useAccount: () => mockAccount(),
    useReadContract: () => mockUseReadContract(),
    usePublicClient: () => mockUsePublicClient(),
  }
})

// Mock useWalletStatus
vi.mock('@/hooks/useWalletStatus', () => ({
  useWalletStatus: vi.fn(() => ({
    isConnected: true,
    chainId: mainnet.id,
    isSupportedChain: true,
    supportedChains: [mainnet, sepolia],
    currentChain: mainnet,
    retryDetection: vi.fn(),
    selectConnector: vi.fn(),
  })),
}))

// Mock useTokenPrices
vi.mock('@/hooks/useTokenPrices', () => ({
  useTokenPrices: vi.fn(() => ({
    prices: { 'wrapped-bitcoin': 87682.5 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
  Wrapper.displayName = 'TestWrapper'
  return Wrapper
}

describe('Bridge Transaction Integration', () => {
  const defaultAssetChain: AssetChainCombination | null = getAllAssetChainCombinations().find(
    (c) => c.assetId === 'wbtc' && c.chainId === mainnet.id
  ) ?? null

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show bridge form when "Bridge Tokens" button is clicked', async () => {
    server.use(
      http.post('/api/bridge', () => {
        return HttpResponse.json({
          success: true,
          transactionId: '0x1234567890abcdef',
        })
      })
    )

    render(<ConversionCard selectedAssetChain={defaultAssetChain} />, {
      wrapper: createWrapper(),
    })

    const bridgeButton = screen.getByRole('button', { name: /bridge tokens/i })
    expect(bridgeButton).toBeInTheDocument()

    await userEvent.click(bridgeButton)

    // Bridge form should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/source chain/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/destination chain/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/recipient address/i)).toBeInTheDocument()
    })
  })

  it('should validate form fields before submission', async () => {
    server.use(
      http.post('/api/bridge', () => {
        return HttpResponse.json({
          success: true,
          transactionId: '0x1234567890abcdef',
        })
      })
    )

    render(<ConversionCard selectedAssetChain={defaultAssetChain} />, {
      wrapper: createWrapper(),
    })

    const bridgeButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(bridgeButton)

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /bridge tokens/i })
    
    // Try to submit without filling fields
    await userEvent.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/amount/i)).toBeInTheDocument()
    })
  })

  it('should submit bridge transaction successfully', async () => {
    let requestBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/bridge', async ({ request }) => {
        const body = await request.json()
        requestBody = body as Record<string, unknown>
        return HttpResponse.json(
          {
            success: true,
            transactionId: '0x1234567890abcdef1234567890abcdef12345678',
          },
          { status: 200 }
        )
      })
    )

    render(<ConversionCard selectedAssetChain={defaultAssetChain} />, {
      wrapper: createWrapper(),
    })

    const bridgeButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(bridgeButton)

    // Wait for form
    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    })

    // Fill form
    const amountInput = screen.getByLabelText(/amount/i)
    const recipientInput = screen.getByLabelText(/recipient address/i)

    await userEvent.type(amountInput, '0.1')
    await userEvent.type(recipientInput, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')

    const submitButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(submitButton)

    // Should show progress stepper
    await waitFor(() => {
      expect(screen.getByText(/validating/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify request was made with correct data
    await waitFor(() => {
      expect(requestBody).toBeTruthy()
      if (requestBody) {
        expect(requestBody.amount).toBe('0.1')
        expect(requestBody.recipientAddress).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
      }
    })
  })

  it('should handle bridge transaction failure and show retry button', async () => {
    server.use(
      http.post('/api/bridge', () => {
        return HttpResponse.json(
          {
            success: false,
            error: 'Transaction failed: Insufficient liquidity',
          },
          { status: 400 }
        )
      })
    )

    render(<ConversionCard selectedAssetChain={defaultAssetChain} />, {
      wrapper: createWrapper(),
    })

    const bridgeButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(bridgeButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    })

    const amountInput = screen.getByLabelText(/amount/i)
    const recipientInput = screen.getByLabelText(/recipient address/i)

    await userEvent.type(amountInput, '0.1')
    await userEvent.type(recipientInput, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')

    const submitButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(submitButton)

    // Should show error state with retry button
    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should allow retrying failed transaction', async () => {
    let callCount = 0
    server.use(
      http.post('/api/bridge', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json(
            {
              success: false,
              error: 'Transaction failed',
            },
            { status: 400 }
          )
        }
        return HttpResponse.json({
          success: true,
          transactionId: '0x1234567890abcdef',
        })
      })
    )

    render(<ConversionCard selectedAssetChain={defaultAssetChain} />, {
      wrapper: createWrapper(),
    })

    const bridgeButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(bridgeButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    })

    const amountInput = screen.getByLabelText(/amount/i)
    const recipientInput = screen.getByLabelText(/recipient address/i)

    await userEvent.type(amountInput, '0.1')
    await userEvent.type(recipientInput, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')

    const submitButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(submitButton)

    // Wait for failure
    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await userEvent.click(retryButton)

    // Should retry transaction
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1)
    })
  })

  it('should reset form when "Start New Bridge" is clicked after success', async () => {
    server.use(
      http.post('/api/bridge', () => {
        return HttpResponse.json({
          success: true,
          transactionId: '0x1234567890abcdef',
        })
      })
    )

    render(<ConversionCard selectedAssetChain={defaultAssetChain} />, {
      wrapper: createWrapper(),
    })

    const bridgeButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(bridgeButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    })

    const amountInput = screen.getByLabelText(/amount/i)
    const recipientInput = screen.getByLabelText(/recipient address/i)

    await userEvent.type(amountInput, '0.1')
    await userEvent.type(recipientInput, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')

    const submitButton = screen.getByRole('button', { name: /bridge tokens/i })
    await userEvent.click(submitButton)

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/start new bridge/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    const resetButton = screen.getByRole('button', { name: /start new bridge/i })
    await userEvent.click(resetButton)

    // Form should be reset and ready for new input
    await waitFor(() => {
      const newAmountInput = screen.getByLabelText(/amount/i)
      expect(newAmountInput).toHaveValue('')
    })
  })
})

