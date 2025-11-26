import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Connector } from 'wagmi'
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  fantom,
  gnosis,
  zkSync,
  scroll,
  linea,
  blast,
  mantle,
  celo,
  aurora,
  metis,
  moonbeam,
  moonriver,
  cronos,
  boba,
  zora,
} from 'wagmi/chains'

// Mock wagmi config first (must be hoisted)
vi.mock('../../lib/wagmi.config', () => ({
  chains: [
    mainnet,
    sepolia,
    polygon,
    arbitrum,
    optimism,
    base,
    bsc,
    avalanche,
    fantom,
    gnosis,
    zkSync,
    scroll,
    linea,
    blast,
    mantle,
    celo,
    aurora,
    metis,
    moonbeam,
    moonriver,
    cronos,
    boba,
    zora,
  ], // Include common chains for detection
  supportedChains: [mainnet, sepolia], // Only mainnet and sepolia are supported
  WBTC_CONTRACT_ADDRESS: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
}))

// Mock storage
vi.mock('../../lib/storage', () => ({
  saveConnectorPreference: vi.fn(),
  loadConnectorPreference: vi.fn(() => null),
  saveChainPreference: vi.fn(),
  loadChainPreference: vi.fn(() => null),
}))

// Mock connectors
vi.mock('@wagmi/connectors', () => ({
  metaMask: vi.fn(() => ({ id: 'io.metamask', name: 'MetaMask' })),
  walletConnect: vi.fn(() => ({ id: 'walletConnect', name: 'WalletConnect' })),
  injected: vi.fn(() => ({ id: 'injected', name: 'Browser Wallet' })),
}))

// Mock wagmi hooks
const mockConnections = vi.fn<() => Array<{ connector: Connector }>>(() => [])
const mockChainId = vi.fn<() => number | undefined>(() => undefined)
const mockAccount = vi.fn<() => { isConnected: boolean; address?: string }>(() => ({
  isConnected: false,
  address: undefined,
}))
const mockUseDisconnect = vi.fn()
const mockUseConnect = vi.fn()
const mockUseReadContract = vi.fn()

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnections: () => mockConnections(),
    useChainId: () => mockChainId(),
    useAccount: () => mockAccount(),
    useDisconnect: () => ({ disconnect: mockUseDisconnect }),
    useConnect: () => ({ connect: mockUseConnect }),
    useReadContract: () => mockUseReadContract(),
  }
})

// Import component after mocks
import { WalletInfoBar } from '../../app/_components/walletInfoBar'

describe('Network Resilience Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
  })

  it('should display connector selector when not connected', () => {
    mockConnections.mockReturnValue([])
    mockAccount.mockReturnValue({ isConnected: false, address: undefined })

    render(<WalletInfoBar />)

    // "Not connected" text removed - ConnectorSelector is the primary UI
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should display chain status badge when connected to supported chain', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(mainnet.id)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    expect(screen.getByLabelText(/network:/i)).toBeInTheDocument()
    expect(screen.getByText(mainnet.name)).toBeInTheDocument()
  })

  it('should display unsupported network badge and retry button for Polygon', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(137) // Polygon (unsupported)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    // Check for badge with unsupported network text (now includes network name)
    const badges = screen.getAllByText(/unsupported network/i)
    expect(badges.length).toBeGreaterThan(0)
    // Check that it shows network name format: "Unsupported Network: Polygon"
    expect(screen.getByText(/unsupported network: polygon/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/retry network detection/i)).toBeInTheDocument()
  })

  it('should display unsupported network badge for Arbitrum', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(arbitrum.id) // Arbitrum (unsupported)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    expect(screen.getByText(/unsupported network: arbitrum one/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/retry network detection/i)).toBeInTheDocument()
  })

  it('should display unsupported network badge for Optimism', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(optimism.id) // Optimism (unsupported)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    expect(screen.getByText(/unsupported network: op mainnet/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/retry network detection/i)).toBeInTheDocument()
  })

  it('should display unsupported network badge for Base', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(base.id) // Base (unsupported)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    expect(screen.getByText(/unsupported network: base/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/retry network detection/i)).toBeInTheDocument()
  })

  it('should display unsupported network badge for BSC', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(bsc.id) // BSC (unsupported)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    expect(screen.getByText(/unsupported network: bnb smart chain/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/retry network detection/i)).toBeInTheDocument()
  })

  it('should display connector selector when not connected', () => {
    mockConnections.mockReturnValue([])
    mockAccount.mockReturnValue({ isConnected: false, address: undefined })

    render(<WalletInfoBar />)

    // Verify connector selector is rendered (check for combobox role or label)
    const connectorSelector = screen.getByRole('combobox', { name: /select wallet connector/i })
    expect(connectorSelector).toBeInTheDocument()
  })

  it('should disable connector selector when connected', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(mainnet.id)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    // Connector selector should not be visible when connected
    expect(screen.queryByLabelText(/select wallet connector/i)).not.toBeInTheDocument()
  })

  it('should display correct chain name for Sepolia testnet', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(sepolia.id)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    expect(screen.getByText(sepolia.name)).toBeInTheDocument()
  })

  it('should show retry button for unsupported chains', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([{ connector: mockConnector }])
    mockChainId.mockReturnValue(137) // Polygon
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    render(<WalletInfoBar />)

    const retryButton = screen.getByLabelText(/retry network detection/i)
    expect(retryButton).toBeInTheDocument()
    expect(retryButton).toHaveTextContent(/retry detection/i)
  })
})

