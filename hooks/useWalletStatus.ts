import { useConnections, useChainId, useAccount } from 'wagmi'
import { useEffect, useCallback, useMemo, useState } from 'react'
import type { Connector } from 'wagmi'
import type { Chain } from 'viem/chains'
import { switchChain as switchChainAction, getConnection } from '@wagmi/core'
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

  // State for network switching
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [switchError, setSwitchError] = useState<Error | null>(null)
  const [switchAttempted, setSwitchAttempted] = useState(false)

  // Type definitions for MetaMask provider
  interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    isMetaMask?: boolean
    on?: (event: string, handler: (chainId: string) => void) => void
    removeListener?: (event: string, handler: (chainId: string) => void) => void
  }
  
  interface WindowWithEthereum extends Window {
    ethereum?: EthereumProvider
  }

  // Helper function to verify MetaMask's actual chainId
  // Uses eth_chainId RPC method to verify the switch actually happened
  const verifyChainSwitch = useCallback(async (
    ethereum: EthereumProvider,
    targetChainId: number,
    chainName: string
  ): Promise<boolean> => {
    try {
      // Wait a bit for MetaMask to process the switch
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Check MetaMask's actual chainId
      const currentChainIdHex = (await ethereum.request({
        method: 'eth_chainId',
      })) as string
      
      const currentChainId = parseInt(currentChainIdHex, 16)
      const targetChainIdHex = `0x${targetChainId.toString(16)}`
      
      if (currentChainId === targetChainId) {
        console.log(`Verified: MetaMask is now on ${chainName} (chainId: ${targetChainIdHex})`)
        return true
      } else {
        console.warn(
          `Chain switch verification failed: MetaMask reports chainId ${currentChainIdHex} (${currentChainId}), expected ${targetChainIdHex} (${targetChainId})`
        )
        return false
      }
    } catch (error) {
      console.error('Error verifying chain switch:', error)
      return false
    }
  }, [])

  // Change network to a supported chain (Ethereum Mainnet first, then Sepolia)
  // Calls MetaMask directly and VERIFIES the switch actually happened
  // Falls back to wagmi's switchChain action if direct call fails
  const changeNetwork = useCallback(async () => {
    if (!isConnected || isSupportedChain || !connector) {
      return
    }

    setSwitchAttempted(true)
    setIsSwitchingChain(true)
    setSwitchError(null)

    try {
      // Check if MetaMask is available directly
      const windowWithEthereum = typeof window !== 'undefined' ? (window as WindowWithEthereum) : null
      const ethereum = windowWithEthereum?.ethereum

      if (ethereum && ethereum.isMetaMask && ethereum.request) {
        // Try calling MetaMask directly first - this should trigger the prompt
        try {
          // Try Ethereum Mainnet first (most common)
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${mainnet.id.toString(16)}` }],
          })
          
          // VERIFY the switch actually happened
          const verified = await verifyChainSwitch(ethereum, mainnet.id, 'Ethereum Mainnet')
          
          if (verified) {
            console.log('Successfully switched to Ethereum Mainnet via direct MetaMask call (verified)')
            setIsSwitchingChain(false)
            setSwitchError(null)
            setSwitchAttempted(false)
            return
          } else {
            // Switch request succeeded but MetaMask didn't actually switch
            throw new Error('Network switch request succeeded but MetaMask did not switch networks. Please switch manually in MetaMask.')
          }
        } catch (mainnetError: unknown) {
          // Check if error is user rejection (code 4001)
          const isUserRejection =
            (mainnetError as { code?: number })?.code === 4001 ||
            (mainnetError as Error)?.message?.includes('rejected') ||
            (mainnetError as Error)?.message?.includes('User rejected')
          
          if (isUserRejection) {
            console.log('Network switch was rejected by user')
            setIsSwitchingChain(false)
            setSwitchError(new Error('Network switch was rejected. Please approve the switch in your wallet.'))
            return
          }

          // If Mainnet switch fails, try Sepolia as fallback
          console.error('Mainnet switch failed, trying Sepolia:', mainnetError)
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${sepolia.id.toString(16)}` }],
            })
            
            // VERIFY the switch actually happened
            const verified = await verifyChainSwitch(ethereum, sepolia.id, 'Sepolia')
            
            if (verified) {
              console.log('Successfully switched to Sepolia via direct MetaMask call (verified)')
              setIsSwitchingChain(false)
              setSwitchError(null)
              setSwitchAttempted(false)
              return
            } else {
              // Switch request succeeded but MetaMask didn't actually switch
              throw new Error('Network switch request succeeded but MetaMask did not switch networks. Please switch manually in MetaMask.')
            }
          } catch (sepoliaError: unknown) {
            const isSepoliaRejection =
              (sepoliaError as { code?: number })?.code === 4001 ||
              (sepoliaError as Error)?.message?.includes('rejected') ||
              (sepoliaError as Error)?.message?.includes('User rejected')
            
            if (isSepoliaRejection) {
              setIsSwitchingChain(false)
              setSwitchError(new Error('Network switch was rejected. Please approve the switch in your wallet.'))
              return
            }
            // If direct call fails, fall through to wagmi's switchChain
            console.warn('Direct MetaMask call failed, falling back to wagmi:', sepoliaError)
          }
        }
      }

      // Fallback to wagmi's switchChain action if direct call not available or failed
      const connection = getConnection(wagmiConfig)
      const activeConnector = connection?.connector ?? connector

      if (!activeConnector) {
        setSwitchError(new Error('No active connector found'))
        setIsSwitchingChain(false)
        return
      }

      // Try Ethereum Mainnet first using wagmi
      try {
        await switchChainAction(wagmiConfig, {
          chainId: mainnet.id,
          connector: activeConnector,
        })
        console.log('Successfully switched to Ethereum Mainnet via wagmi')
        setIsSwitchingChain(false)
        setSwitchError(null)
        setSwitchAttempted(false)
      } catch (mainnetError: unknown) {
        // Check if error is user rejection (code 4001)
        const isUserRejection =
          (mainnetError as { code?: number })?.code === 4001 ||
          (mainnetError as Error)?.message?.includes('rejected') ||
          (mainnetError as Error)?.message?.includes('User rejected')
        
        if (isUserRejection) {
          console.log('Network switch was rejected by user')
          setIsSwitchingChain(false)
          setSwitchError(new Error('Network switch was rejected. Please approve the switch in your wallet.'))
          return
        }

        // If Mainnet switch fails, try Sepolia as fallback
        console.error('Mainnet switch failed, trying Sepolia:', mainnetError)
        try {
          await switchChainAction(wagmiConfig, {
            chainId: sepolia.id,
            connector: activeConnector,
          })
          console.log('Successfully switched to Sepolia via wagmi')
          setIsSwitchingChain(false)
          setSwitchError(null)
          setSwitchAttempted(false)
        } catch (sepoliaError: unknown) {
          // Both switches failed
          setIsSwitchingChain(false)
          const isSepoliaRejection =
            (sepoliaError as { code?: number })?.code === 4001 ||
            (sepoliaError as Error)?.message?.includes('rejected') ||
            (sepoliaError as Error)?.message?.includes('User rejected')
          
          if (isSepoliaRejection) {
            setSwitchError(new Error('Network switch was rejected. Please approve the switch in your wallet.'))
          } else {
            const errorMessage = (mainnetError instanceof Error ? mainnetError.message : String(mainnetError)) ||
                                 (sepoliaError instanceof Error ? sepoliaError.message : String(sepoliaError))
            setSwitchError(new Error(`Failed to switch network: ${errorMessage}`))
          }
          console.error('Both network switches failed:', { mainnetError, sepoliaError })
        }
      }
    } catch (error) {
      setIsSwitchingChain(false)
      const err = error instanceof Error ? error : new Error(String(error))
      setSwitchError(err)
      console.error('Network switch error:', error)
    }
  }, [isConnected, isSupportedChain, connector, verifyChainSwitch])


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

