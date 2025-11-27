import { useConnections, useChainId, useAccount, useDisconnect } from 'wagmi'
import { useEffect, useCallback, useMemo } from 'react'
import type { Connector } from 'wagmi'
import type { Chain } from 'viem/chains'
import { supportedChains } from '@/lib/wagmi.config'
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
  retryDetection: () => void
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
  const { disconnect } = useDisconnect()

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

  // Retry chain detection by disconnecting the wallet
  // This allows the user to reconnect (hopefully to a supported network)
  // Better UX than reloading the page - preserves app state and is less disruptive
  const retryDetection = useCallback(() => {
    if (isConnected) {
      disconnect()
    }
  }, [isConnected, disconnect])

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
    retryDetection,
    selectConnector,
  }
}

