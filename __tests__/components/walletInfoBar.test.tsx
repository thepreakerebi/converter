import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseReadContractParameters } from 'wagmi'
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
  ],
  supportedChains: [mainnet, sepolia],
  WBTC_CONTRACT_ADDRESS: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
}))

// Mock storage
vi.mock('../../lib/storage', () => ({
  saveConnectorPreference: vi.fn(),
  loadConnectorPreference: vi.fn(() => null),
  saveChainPreference: vi.fn(),
  loadChainPreference: vi.fn(() => null),
}))

// Mock useWalletStatus hook
const mockUseWalletStatus = vi.fn()
vi.mock('../../hooks/useWalletStatus', () => ({
  useWalletStatus: () => mockUseWalletStatus(),
}))

// Mock wagmi hooks
const mockUseDisconnect = vi.fn()
const mockUseConnect = vi.fn()
const mockUseReadContract = vi.fn()
const mockUseAccount = vi.fn()

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useDisconnect: () => ({ disconnect: mockUseDisconnect }),
    useConnect: () => ({ connect: mockUseConnect }),
    useReadContract: (config: UseReadContractParameters) => mockUseReadContract(config),
    useAccount: () => mockUseAccount(),
  }
})

// Mock connectors
vi.mock('@wagmi/connectors', () => ({
  metaMask: vi.fn(() => () => ({})),
  injected: vi.fn(() => () => ({})),
}))

// Import component after mocks
import { WalletInfoBar } from '../../app/_components/walletInfoBar'

describe('WalletInfoBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({ address: undefined })
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
    mockUseDisconnect.mockImplementation(() => {})
    mockUseConnect.mockImplementation(() => {})

    // Default mock for useWalletStatus
    mockUseWalletStatus.mockReturnValue({
      isConnected: false,
      connector: null,
      chainId: undefined,
      isSupportedChain: false,
      supportedChains: [mainnet, sepolia],
      currentChain: null,
      changeNetwork: vi.fn(),
      isSwitchingChain: false,
      switchError: null,
      switchAttempted: false,
      selectConnector: vi.fn(),
    })
  })

  it('should render wallet info bar', () => {
    render(<WalletInfoBar />)
    // "Not connected" text removed - ConnectorSelector is the primary UI
    expect(screen.getByLabelText(/Select wallet connector/i)).toBeInTheDocument()
  })

  it('should show not connected state', () => {
    render(<WalletInfoBar />)

    // "Not connected" text removed - ConnectorSelector shows "Connect Wallet" placeholder
    expect(screen.getByLabelText(/Select wallet connector/i)).toBeInTheDocument()
    // SelectValue shows placeholder text, check for connector selector presence
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(
      screen.getByText(/Connect your wallet to view on-chain/i)
    ).toBeInTheDocument()
  })

  it('should show connected state with address', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockUseWalletStatus.mockReturnValue({
      isConnected: true,
      connector: mockConnector,
      chainId: mainnet.id,
      isSupportedChain: true,
      supportedChains: [mainnet, sepolia],
      currentChain: mainnet,
      changeNetwork: vi.fn(),
      isSwitchingChain: false,
      switchError: null,
      switchAttempted: false,
      selectConnector: vi.fn(),
    })
    mockUseAccount.mockReturnValue({
      address: mockAddress as `0x${string}`,
    })

    render(<WalletInfoBar />)

    expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument()
    expect(screen.getByText(/Disconnect/i)).toBeInTheDocument()
  })

  it('should show Ethereum Mainnet badge when connected to mainnet', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockUseWalletStatus.mockReturnValue({
      isConnected: true,
      connector: mockConnector,
      chainId: mainnet.id,
      isSupportedChain: true,
      supportedChains: [mainnet, sepolia],
      currentChain: mainnet,
      changeNetwork: vi.fn(),
      isSwitchingChain: false,
      switchError: null,
      switchAttempted: false,
      selectConnector: vi.fn(),
    })
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    })

    render(<WalletInfoBar />)

    expect(screen.getByText(mainnet.name)).toBeInTheDocument()
    // Chain ID display removed - not user-friendly
  })

  it('should show unsupported network badge when not on supported chain', () => {
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockUseWalletStatus.mockReturnValue({
      isConnected: true,
      connector: mockConnector,
      chainId: 5, // Goerli testnet (unsupported)
      isSupportedChain: false,
      supportedChains: [mainnet, sepolia],
      currentChain: null,
      changeNetwork: vi.fn(),
      isSwitchingChain: false,
      switchError: null,
      switchAttempted: false,
      selectConnector: vi.fn(),
    })
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    })

    render(<WalletInfoBar />)

    // "Unsupported Network" appears in both badge and alert
    const unsupportedTexts = screen.getAllByText(/Unsupported Network/i)
    expect(unsupportedTexts.length).toBeGreaterThan(0)
    // Chain ID display removed - not user-friendly
  })

  it('should show wBTC balance when connected and on mainnet', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockUseWalletStatus.mockReturnValue({
      isConnected: true,
      connector: mockConnector,
      chainId: mainnet.id,
      isSupportedChain: true,
      supportedChains: [mainnet, sepolia],
      currentChain: mainnet,
      changeNetwork: vi.fn(),
      isSwitchingChain: false,
      switchError: null,
      switchAttempted: false,
      selectConnector: vi.fn(),
    })
    mockUseAccount.mockReturnValue({
      address: mockAddress as `0x${string}`,
    })

    // Mock balance and decimals
    mockUseReadContract.mockImplementation((config: UseReadContractParameters) => {
      if (config.functionName === 'balanceOf') {
        return {
          data: BigInt('200000000'), // 2 wBTC (8 decimals)
          isLoading: false,
        }
      }
      if (config.functionName === 'decimals') {
        return {
          data: 8,
          isLoading: false,
        }
      }
      return { data: undefined, isLoading: false }
    })

    render(<WalletInfoBar />)

    await waitFor(() => {
      expect(screen.getByText(/Balance:/i)).toBeInTheDocument()
      expect(screen.getByText(/2 wBTC/i)).toBeInTheDocument()
    })
  })

  // Connect Wallet button test commented out - button removed, ConnectorSelector handles connection
  // it('should call connect when Connect Wallet button is clicked', async () => {
  //   const user = userEvent.setup()
  //   render(<WalletInfoBar />)
  //
  //   const connectButton = screen.getByText(/Connect Wallet/i)
  //   await user.click(connectButton)
  //
  //   expect(mockUseConnect).toHaveBeenCalled()
  // })

  it('should call disconnect when Disconnect button is clicked', async () => {
    const user = userEvent.setup()
    const mockConnector = {
      id: 'io.metamask',
      name: 'MetaMask',
    } as unknown as Connector

    mockUseWalletStatus.mockReturnValue({
      isConnected: true,
      connector: mockConnector,
      chainId: mainnet.id,
      isSupportedChain: true,
      supportedChains: [mainnet, sepolia],
      currentChain: mainnet,
      changeNetwork: vi.fn(),
      isSwitchingChain: false,
      switchError: null,
      switchAttempted: false,
      selectConnector: vi.fn(),
    })
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    })

    render(<WalletInfoBar />)

    await waitFor(() => {
      expect(screen.getByText(/Disconnect/i)).toBeInTheDocument()
    })

    const disconnectButton = screen.getByText(/Disconnect/i)
    await user.click(disconnectButton)

    expect(mockUseDisconnect).toHaveBeenCalled()
  })

  // Network warning alert test removed - alert moved to page.tsx
  // The alert is now displayed in the page component, not WalletInfoBar
})

