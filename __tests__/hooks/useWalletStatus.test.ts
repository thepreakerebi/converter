import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Connector } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Mock wagmi config first (must be hoisted)
vi.mock('../../lib/wagmi.config', () => ({
  supportedChains: [mainnet, sepolia],
}))

// Mock storage functions
vi.mock('../../lib/storage', () => ({
  saveConnectorPreference: vi.fn(),
  loadConnectorPreference: vi.fn(() => null),
  saveChainPreference: vi.fn(),
  loadChainPreference: vi.fn(() => null),
}))

// Mock wagmi hooks
const mockConnections = vi.fn<() => Array<{ connector: Connector }>>(() => [])
const mockChainId = vi.fn<() => number | undefined>(() => undefined)
const mockAccount = vi.fn<() => { isConnected: boolean; address?: string }>(() => ({
  isConnected: false,
  address: undefined,
}))
const mockDisconnect = vi.fn()

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnections: () => mockConnections(),
    useChainId: () => mockChainId(),
    useAccount: () => mockAccount(),
    useDisconnect: () => ({ disconnect: mockDisconnect }),
  }
})

// Import hook after mocks are set up
import { useWalletStatus } from '../../hooks/useWalletStatus'

describe('useWalletStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage
    localStorage.clear()
  })

  it('should return disconnected state when not connected', () => {
    mockConnections.mockReturnValue([])
    mockAccount.mockReturnValue({ isConnected: false, address: undefined })

    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.connector).toBeNull()
    expect(result.current.isSupportedChain).toBe(false)
    expect(result.current.currentChain).toBeNull()
  })

  it('should detect connected state', () => {
    const mockConnector = {
      id: 'metaMask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.isConnected).toBe(true)
    expect(result.current.connector).toBe(mockConnector)
  })

  it('should detect supported chain (Ethereum Mainnet)', () => {
    const mockConnector = {
      id: 'metaMask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockChainId.mockReturnValue(mainnet.id)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.isSupportedChain).toBe(true)
    expect(result.current.currentChain).toEqual(mainnet)
    expect(result.current.chainId).toBe(mainnet.id)
  })

  it('should detect supported chain (Sepolia Testnet)', () => {
    const mockConnector = {
      id: 'metaMask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockChainId.mockReturnValue(sepolia.id)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.isSupportedChain).toBe(true)
    expect(result.current.currentChain).toEqual(sepolia)
    expect(result.current.chainId).toBe(sepolia.id)
  })

  it('should detect unsupported chain', () => {
    const mockConnector = {
      id: 'metaMask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockChainId.mockReturnValue(137) // Polygon
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.isSupportedChain).toBe(false)
    expect(result.current.currentChain).toBeNull()
    expect(result.current.chainId).toBe(137)
  })

  it('should handle undefined chainId', () => {
    const mockConnector = {
      id: 'metaMask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockChainId.mockReturnValue(undefined)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.isSupportedChain).toBe(false)
    expect(result.current.currentChain).toBeNull()
    expect(result.current.chainId).toBeUndefined()
  })

  it('should provide retryDetection function that disconnects when connected', () => {
    mockConnections.mockReturnValue([{ connector: { id: 'test' } as Connector }])
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    
    const { result } = renderHook(() => useWalletStatus())

    expect(typeof result.current.retryDetection).toBe('function')

    // Call retryDetection - should disconnect if connected
    result.current.retryDetection()
    
    // Verify disconnect was called when connected
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should not call disconnect when retryDetection is called but not connected', () => {
    mockConnections.mockReturnValue([])
    mockAccount.mockReturnValue({ isConnected: false, address: undefined })
    
    const { result } = renderHook(() => useWalletStatus())

    result.current.retryDetection()
    
    // Disconnect should not be called when not connected
    expect(mockDisconnect).not.toHaveBeenCalled()
  })

  it('should provide selectConnector function', async () => {
    const { saveConnectorPreference } = await import('../../lib/storage')
    const { result } = renderHook(() => useWalletStatus())

    expect(typeof result.current.selectConnector).toBe('function')

    result.current.selectConnector('metaMask')

    expect(saveConnectorPreference).toHaveBeenCalledWith('metaMask')
  })

  it('should return supportedChains array', () => {
    const { result } = renderHook(() => useWalletStatus())

    expect(result.current.supportedChains).toEqual([mainnet, sepolia])
    expect(result.current.supportedChains.length).toBe(2)
  })

  it('should persist connector preference when connected', async () => {
    const { saveConnectorPreference } = await import('../../lib/storage')
    const mockConnector = {
      id: 'walletConnect',
      name: 'WalletConnect',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    renderHook(() => useWalletStatus())

    await waitFor(() => {
      expect(saveConnectorPreference).toHaveBeenCalledWith('walletConnect')
    })
  })

  it('should persist chain preference when on supported chain', async () => {
    const { saveChainPreference } = await import('../../lib/storage')
    const mockConnector = {
      id: 'metaMask',
      name: 'MetaMask',
    } as unknown as Connector

    mockConnections.mockReturnValue([
      {
        connector: mockConnector,
      },
    ])
    mockChainId.mockReturnValue(mainnet.id)
    mockAccount.mockReturnValue({ isConnected: true, address: '0x123' })

    renderHook(() => useWalletStatus())

    await waitFor(() => {
      expect(saveChainPreference).toHaveBeenCalledWith(mainnet.id)
    })
  })
})

