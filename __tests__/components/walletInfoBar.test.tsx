import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WalletInfoBar } from '../../app/_components/walletInfoBar'
import type { UseReadContractParameters } from 'wagmi'

// Mock wagmi hooks
const mockUseConnections = vi.fn()
const mockUseChainId = vi.fn()
const mockUseAccount = vi.fn()
const mockUseDisconnect = vi.fn()
const mockUseConnect = vi.fn()
const mockUseReadContract = vi.fn()

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnections: () => mockUseConnections(),
    useChainId: () => mockUseChainId(),
    useAccount: () => mockUseAccount(),
    useDisconnect: () => ({ disconnect: mockUseDisconnect }),
    useConnect: () => ({ connect: mockUseConnect }),
    useReadContract: (config: UseReadContractParameters) => mockUseReadContract(config),
  }
})

// Mock connectors
vi.mock('@wagmi/connectors', () => ({
  metaMask: vi.fn(() => () => ({})),
  injected: vi.fn(() => () => ({})),
}))

describe('WalletInfoBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseConnections.mockReturnValue([])
    mockUseChainId.mockReturnValue(1)
    mockUseAccount.mockReturnValue({ address: undefined })
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
    mockUseDisconnect.mockImplementation(() => {})
    mockUseConnect.mockImplementation(() => {})
  })

  it('should render wallet info bar', () => {
    render(<WalletInfoBar />)
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument()
  })

  it('should show not connected state', () => {
    render(<WalletInfoBar />)

    expect(screen.getByText(/Not connected/i)).toBeInTheDocument()
    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Connect your wallet to enable conversion features/i)
    ).toBeInTheDocument()
  })

  it('should show connected state with address', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    mockUseChainId.mockReturnValue(1)
    mockUseAccount.mockReturnValue({
      address: mockAddress as `0x${string}`,
    })

    render(<WalletInfoBar />)

    expect(screen.getByText(/Connected/i)).toBeInTheDocument()
    expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument()
    expect(screen.getByText(/Disconnect/i)).toBeInTheDocument()
  })

  it('should show Ethereum Mainnet badge when connected to mainnet', () => {
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    mockUseChainId.mockReturnValue(1)
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    })

    render(<WalletInfoBar />)

    expect(screen.getByText(/Ethereum Mainnet/i)).toBeInTheDocument()
    expect(screen.getByText(/Chain ID: 1/i)).toBeInTheDocument()
  })

  it('should show wrong network badge when not on mainnet', () => {
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    mockUseChainId.mockReturnValue(5) // Goerli testnet
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    })

    render(<WalletInfoBar />)

    expect(screen.getByText(/Wrong Network/i)).toBeInTheDocument()
    expect(screen.getByText(/Chain ID: 5/i)).toBeInTheDocument()
  })

  it('should show wBTC balance when connected and on mainnet', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    mockUseChainId.mockReturnValue(1)
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

  it('should call connect when Connect Wallet button is clicked', async () => {
    const user = userEvent.setup()
    render(<WalletInfoBar />)

    const connectButton = screen.getByText(/Connect Wallet/i)
    await user.click(connectButton)

    expect(mockUseConnect).toHaveBeenCalled()
  })

  it('should call disconnect when Disconnect button is clicked', async () => {
    const user = userEvent.setup()
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    mockUseChainId.mockReturnValue(1)
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

  it('should show network warning alert when on wrong network', () => {
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    mockUseChainId.mockReturnValue(5) // Wrong network
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    })

    render(<WalletInfoBar />)

    expect(
      screen.getByText(/Please switch to Ethereum Mainnet/i)
    ).toBeInTheDocument()
  })
})

