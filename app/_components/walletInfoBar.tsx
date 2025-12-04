'use client'

import { useDisconnect, useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { Button } from '@/components/ui/button' // Still needed for Disconnect button
import { Separator } from '@/components/ui/separator'
import { Wallet } from 'lucide-react'
import { formatUnits, erc20Abi } from 'viem'
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { ConnectorSelector } from './connectorSelector'
import { ChainStatusBadge } from './chainStatusBadge'
import { AssetChainSelector } from './assetChainSelector'
import type { AssetChainCombination } from '@/lib/assets-config'
import { createAssetChainKey } from '@/lib/assets-config'

/**
 * WalletInfoBar Component
 * Fixed header displaying wallet connection status, network info, and selected asset balance
 * Uses useWalletStatus hook for centralized wallet state management
 */
interface WalletInfoBarProps {
  selectedAssetChain?: AssetChainCombination | null
  onAssetChainChange?: (combination: AssetChainCombination | null) => void
}

export function WalletInfoBar({ selectedAssetChain, onAssetChainChange }: WalletInfoBarProps = {}) {
  const { isConnected, chainId } = useWalletStatus()
  const account = useAccount()
  const { disconnect } = useDisconnect()
  const address = account.address

  // Determine if we should read balance for selected asset
  const shouldReadBalance =
    isConnected &&
    !!selectedAssetChain &&
    !!address &&
    chainId === selectedAssetChain.chainId &&
    selectedAssetChain.chainId in selectedAssetChain.asset.chains

  // Get contract address and decimals for selected asset on current chain
  const contractAddress = selectedAssetChain
    ? (selectedAssetChain.asset.chains[selectedAssetChain.chainId]?.address as `0x${string}` | undefined)
    : undefined
  const assetDecimals = selectedAssetChain
    ? selectedAssetChain.asset.chains[selectedAssetChain.chainId]?.decimals
    : undefined

  // Read balance for selected asset using ERC-20 balanceOf
  const { data: balanceRaw, isLoading: isLoadingBalance } = useReadContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: shouldReadBalance && !!contractAddress && !!address,
    },
  })

  // Read decimals for selected asset (fallback if not in config)
  const { data: decimals, isLoading: isLoadingDecimals } = useReadContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: shouldReadBalance && !!contractAddress && assetDecimals === undefined,
    },
  })

  // Format balance - handle loading and zero balance cases
  const displayDecimals = assetDecimals ?? decimals ?? 18
  const balance =
    balanceRaw !== undefined && displayDecimals !== undefined
      ? Number(formatUnits(balanceRaw, displayDecimals))
      : null

  // Format balance for display (show up to 6 decimal places, remove trailing zeros)
  const formatBalance = (amount: number | null): string => {
    if (amount === null) return '...'
    if (amount === 0) return '0'
    // Format with up to 6 decimal places, remove trailing zeros
    return amount.toFixed(6).replace(/\.?0+$/, '')
  }

  const formattedBalance = formatBalance(balance)
  const isLoadingBalanceData = isLoadingBalance || (isLoadingDecimals && assetDecimals === undefined)

  // Format address for display
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // handleConnect commented out - ConnectorSelector handles connection now
  // const handleConnect = () => {
  //   // Try MetaMask first, fallback to injected connector
  //   try {
  //     connect({ connector: metaMask() })
  //   } catch {
  //     connect({ connector: injected() })
  //   }
  // }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container mx-auto px-4 py-3">
        <section
          className={`flex flex-col gap-3 ${
            isConnected
              ? 'sm:flex-row sm:items-center sm:justify-between'
              : 'items-center justify-center md:flex-row md:items-center md:gap-4'
          }`}
        >
          {/* Left side: Wallet status */}
          <section className="flex flex-wrap items-center gap-2 sm:gap-4">
            {isConnected ? (
              <>
                {/* <section className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <span className="text-sm font-medium">Connected</span>
                </section> */}
                <Separator orientation="vertical" className="h-4" />
                <section className="flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-mono" aria-label="Wallet address">
                    {formatAddress(address)}
                  </span>
                </section>
                {selectedAssetChain && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <section className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Balance:</span>
                      <span className="text-sm font-medium" aria-label={`${selectedAssetChain.asset.symbol} balance`}>
                        {isLoadingBalanceData
                          ? '...'
                          : balance !== null
                            ? `${formattedBalance} ${selectedAssetChain.asset.symbol}`
                            : `0 ${selectedAssetChain.asset.symbol}`}
                      </span>
                    </section>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <section className="flex items-center gap-2">
                {/* <XCircle className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Not connected</span> */}
                {/* Connect Wallet button commented out - ConnectorSelector handles connection */}
                {/* <Button
                  variant="default"
                  size="sm"
                  onClick={handleConnect}
                  aria-label="Connect wallet"
                >
                  Connect Wallet
                </Button> */}
              </section>
            )}
          </section>

          {/* Right side: Network status (when connected) or Asset-Chain selector + Connector selector (when not connected) */}
          {isConnected ? (
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {/* AssetChainSelector removed when connected - only show when not connected */}
              <ChainStatusBadge />
            </section>
          ) : (
            <section className="flex flex-col gap-3 items-center md:flex-row md:items-center">
              <AssetChainSelector
                value={selectedAssetChain ? createAssetChainKey(selectedAssetChain.assetId, selectedAssetChain.chainId) : undefined}
                onValueChange={(value, combination) => onAssetChainChange?.(combination ?? null)}
              />
              <ConnectorSelector />
            </section>
          )}
        </section>
      </nav>
    </header>
  )
}

