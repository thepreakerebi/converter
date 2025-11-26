import { useConnections, useChainId, useAccount } from 'wagmi'
import { useEffect, useCallback, useMemo, useState } from 'react'
import type { Connector } from 'wagmi'
import type { Chain } from 'viem/chains'
import { switchChain } from '@wagmi/core'
import { wagmiConfig } from '@/lib/wagmi.config'
import { supportedChains } from '@/lib/wagmi.config'
import { mainnet, sepolia } from 'wagmi/chains'
import {
  saveConnectorPreference,
  loadConnectorPreference,
  saveChainPreference,
  loadChainPreference,
} from '@/lib/storage'

/**
 * Hook return type for useWalletStatus
 */
export interface UseWalletStatusReturn {
  isConnected: boolean
  connector: Connector | null
  chainId: number | undefined
  isSupportedChain: boolean
  supportedChains: readonly Chain[]
  currentChain: Chain | null
  changeNetwork: () => Promise<void>
  isSwitchingChain: boolean
  switchError: Error | null
  switchAttempted: boolean
  selectConnector: (connectorId: string) => void
}

/**
 * Custom hook for wallet connection status and chain detection
 * Provides centralized wallet state management with localStorage persistence
 *
 * @returns Wallet status information and utility functions
 */
export function useWalletStatus(): UseWalletStatusReturn {
  const connections = useConnections()
  const chainId = useChainId()
  const account = useAccount()

  // Determine if wallet is connected
  const isConnected = account.isConnected ?? connections.length > 0

  // Get current connector from connections
  const connector = useMemo(() => {
    if (connections.length === 0) return null
    return connections[0]?.connector ?? null
  }, [connections])

  // Check if current chain is supported
  const isSupportedChain = useMemo(() => {
    if (chainId === undefined) return false
    return supportedChains.some((chain) => chain.id === chainId)
  }, [chainId])

  // Get current chain object
  const currentChain = useMemo(() => {
    if (chainId === undefined) return null
    return supportedChains.find((chain) => chain.id === chainId) ?? null
  }, [chainId])

  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [switchError, setSwitchError] = useState<Error | null>(null)
  const [switchAttempted, setSwitchAttempted] = useState(false)

  // Change network to a supported chain (Ethereum Mainnet first, then Sepolia)
  // Uses wagmi's switchChain action for proper chain switching
  // Reference: https://wagmi.sh/core/api/actions/switchChain
  const changeNetwork = useCallback(async () => {
    if (!isConnected || isSupportedChain) return

    setSwitchAttempted(true)
    setIsSwitchingChain(true)
    setSwitchError(null)
    
    try {
      // Try Ethereum Mainnet first (most common)
      try {
        await switchChain(wagmiConfig, { chainId: mainnet.id })
        setIsSwitchingChain(false)
        setSwitchError(null)
        // Reset switchAttempted after successful switch
        // Small delay to allow chainId to update via wagmi
        setTimeout(() => setSwitchAttempted(false), 100)
      } catch (mainnetError: unknown) {
        // If Mainnet switch fails, try Sepolia as fallback
        try {
          await switchChain(wagmiConfig, { chainId: sepolia.id })
          setIsSwitchingChain(false)
          setSwitchError(null)
          // Reset switchAttempted after successful switch
          setTimeout(() => setSwitchAttempted(false), 100)
        } catch (sepoliaError: unknown) {
          // Both failed - set error state
          setIsSwitchingChain(false)
          const error = mainnetError instanceof Error ? mainnetError : new Error(String(mainnetError))
          setSwitchError(error)
          console.error('Failed to switch to supported network:', { mainnetError, sepoliaError })
        }
      }
    } catch (error) {
      setIsSwitchingChain(false)
      const err = error instanceof Error ? error : new Error(String(error))
      setSwitchError(err)
      console.error('Network switch error:', error)
    }
  }, [isConnected, isSupportedChain])

  // Select connector by ID
  // Note: This doesn't actually switch connectors, but saves preference
  // The actual connection is handled by wagmi's useConnect hook
  const selectConnector = useCallback(
    (connectorId: string) => {
      saveConnectorPreference(connectorId)
      // The preference will be used when connecting next time
    },
    []
  )

  // Persist connector preference when connected
  useEffect(() => {
    if (connector && isConnected) {
      const connectorId = connector.id
      if (connectorId) {
        saveConnectorPreference(connectorId)
      }
    }
  }, [connector, isConnected])

  // Persist chain preference when chain changes
  useEffect(() => {
    if (chainId !== undefined && isSupportedChain) {
      saveChainPreference(chainId)
    }
  }, [chainId, isSupportedChain])

  // Load and apply saved preferences on mount
  useEffect(() => {
    // Load preferences for future use (e.g., connector restoration)
    // These are loaded but not automatically applied
    // Components using this hook can use these values to restore state
    // The actual connection/chain switching is handled by wagmi
    loadConnectorPreference()
    loadChainPreference()
  }, [])

  return {
    isConnected,
    connector,
    chainId,
    isSupportedChain,
    supportedChains,
    currentChain,
    changeNetwork,
    isSwitchingChain,
    switchError,
    switchAttempted,
    selectConnector,
  }
}

