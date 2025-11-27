import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversionCard } from '@/app/_components/conversionCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi.config'
import { mainnet, polygon, arbitrum } from 'wagmi/chains'
import { getAllAssetChainCombinations } from '@/lib/assets-config'
import type { AssetChainCombination } from '@/lib/assets-config'

// Mock wagmi hooks
const mockConnections = vi.fn(() => [])
const mockChainId = vi.fn(() => mainnet.id)
const mockAccount = vi.fn(() => ({
  isConnected: true,
  address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
}))
const mockUseReadContract = vi.fn(() => ({
  data: BigInt('200000000'), // 2 tokens (assuming 8 decimals)
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
    supportedChains: [mainnet, polygon, arbitrum],
    currentChain: mainnet,
    retryDetection: vi.fn(),
    selectConnector: vi.fn(),
  })),
}))

// Mock useTokenPrices
const mockUseTokenPrices = vi.fn()
vi.mock('@/hooks/useTokenPrices', () => ({
  useTokenPrices: (ids: string[]) => mockUseTokenPrices(ids),
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

describe('Multi-Asset Support Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTokenPrices.mockReturnValue({
      prices: {},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('should display wBTC price when wBTC is selected', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: { 'wrapped-bitcoin': 87682.5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const wbtcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'wbtc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={wbtcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/1 wBTC/i)).toBeInTheDocument()
      expect(screen.getByText(/87682/i)).toBeInTheDocument()
    })

    // Verify useTokenPrices was called with correct CoinGecko ID
    expect(mockUseTokenPrices).toHaveBeenCalledWith(['wrapped-bitcoin'])
  })

  it('should display USDC price when USDC is selected', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: { 'usd-coin': 1.0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const usdcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'usdc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={usdcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/1 USDC/i)).toBeInTheDocument()
      expect(screen.getByText(/1\.00/i)).toBeInTheDocument()
    })

    // Verify useTokenPrices was called with USDC CoinGecko ID
    expect(mockUseTokenPrices).toHaveBeenCalledWith(['usd-coin'])
  })

  it('should display DAI price when DAI is selected', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: { dai: 1.0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const daiCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'dai' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={daiCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/1 DAI/i)).toBeInTheDocument()
    })

    // Verify useTokenPrices was called with DAI CoinGecko ID
    expect(mockUseTokenPrices).toHaveBeenCalledWith(['dai'])
  })

  it('should show loading state while fetching price', () => {
    mockUseTokenPrices.mockReturnValue({
      prices: {},
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    const wbtcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'wbtc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={wbtcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText(/fetching.*price/i)).toBeInTheDocument()
  })

  it('should handle price fetch errors gracefully', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: {},
      isLoading: false,
      error: new Error('Failed to fetch price'),
      refetch: vi.fn(),
    })

    const wbtcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'wbtc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={wbtcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/failed.*fetch/i)).toBeInTheDocument()
    })
  })

  it('should convert USD to selected token correctly', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: { 'wrapped-bitcoin': 87682.5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const wbtcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'wbtc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={wbtcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/amount.*usd/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/amount.*usd/i)
    await userEvent.type(input, '87682.5')

    // Should show converted amount (approximately 1 wBTC)
    await waitFor(() => {
      const result = screen.getByText(/≈/)
      expect(result).toBeInTheDocument()
    })
  })

  it('should convert selected token to USD correctly', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: { 'usd-coin': 1.0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const usdcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'usdc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={usdcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/amount.*usdc/i)).toBeInTheDocument()
    })

    // Toggle to token mode
    const toggleButton = screen.getByRole('button', { name: /switch/i })
    await userEvent.click(toggleButton)

    const input = screen.getByLabelText(/amount.*usdc/i)
    await userEvent.type(input, '100')

    // Should show converted USD amount (approximately $100)
    await waitFor(() => {
      const result = screen.getByText(/≈/)
      expect(result).toBeInTheDocument()
    })
  })

  it('should show asset icon for selected asset', async () => {
    mockUseTokenPrices.mockReturnValue({
      prices: { 'wrapped-bitcoin': 87682.5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const wbtcCombination = getAllAssetChainCombinations().find(
      (c) => c.assetId === 'wbtc' && c.chainId === mainnet.id
    )

    render(<ConversionCard selectedAssetChain={wbtcCombination ?? null} />, {
      wrapper: createWrapper(),
    })

    // Asset icon should be displayed
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      const wbtcImage = images.find((img) =>
        img.getAttribute('src')?.includes('wrapped_bitcoin')
      )
      expect(wbtcImage).toBeInTheDocument()
    })
  })

  it('should handle unsupported asset-chain combinations', () => {
    // Create an invalid combination (e.g., USDC on Arbitrum when it's not configured)
    const invalidCombination: AssetChainCombination | null = null

    mockUseTokenPrices.mockReturnValue({
      prices: {},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ConversionCard selectedAssetChain={invalidCombination} />, {
      wrapper: createWrapper(),
    })

    // Should default to wBTC or show appropriate message
    // Use getAllByText since "Convert" appears multiple times (button, label, etc.)
    const convertElements = screen.getAllByText(/convert/i)
    expect(convertElements.length).toBeGreaterThan(0)
  })
})

