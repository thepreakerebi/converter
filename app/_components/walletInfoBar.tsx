'use client'

import { useConnections, useChainId, useDisconnect, useConnect, useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { metaMask, injected } from '@wagmi/connectors'
import { AlertCircle, Wallet, CheckCircle2, XCircle } from 'lucide-react'
import { wbtcContractConfig, WBTC_FUNCTIONS } from '@/lib/wbtc-contract'
import { formatWbtc } from '@/lib/conversion'
import { formatUnits } from 'viem'

/**
 * WalletInfoBar Component
 * Fixed header displaying wallet connection status, network info, and wBTC balance
 */
export function WalletInfoBar() {
  const connections = useConnections()
  const isConnected = connections.length > 0
  const account = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { connect } = useConnect()

  const isMainnet = chainId === mainnet.id
  const address = account.address

  // Read wBTC balance if connected using balanceOf
  const { data: wbtcBalanceRaw, isLoading: isLoadingBalance } = useReadContract({
    ...wbtcContractConfig,
    functionName: WBTC_FUNCTIONS.balanceOf,
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && isMainnet && !!address,
    },
  })

  // Read decimals for formatting
  const { data: decimals } = useReadContract({
    ...wbtcContractConfig,
    functionName: WBTC_FUNCTIONS.decimals,
    query: {
      enabled: isConnected && isMainnet && !!address,
    },
  })

  // Format balance
  const wbtcBalance =
    wbtcBalanceRaw && decimals
      ? formatWbtc(Number(formatUnits(wbtcBalanceRaw, decimals)))
      : null

  // Format address for display
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = () => {
    // Try MetaMask first, fallback to injected connector
    try {
      connect({ connector: metaMask() })
    } catch {
      connect({ connector: injected() })
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
                <section className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <span className="text-sm font-medium">Connected</span>
                </section>
                <Separator orientation="vertical" className="h-4" />
                <section className="flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-mono" aria-label="Wallet address">
                    {formatAddress(address)}
                  </span>
                </section>
                {isMainnet && wbtcBalance !== null && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <section className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Balance:</span>
                      <span className="text-sm font-medium" aria-label="wBTC balance">
                        {isLoadingBalance ? '...' : wbtcBalance}
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
                <XCircle className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Not connected</span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConnect}
                  aria-label="Connect wallet"
                >
                  Connect Wallet
                </Button>
              </section>
            )}
          </section>

          {/* Right side: Network status (when connected) or Alert (when not connected) */}
          {isConnected ? (
            <section className="flex items-center gap-2">
              <Badge
                variant={isMainnet ? 'default' : 'destructive'}
                className="flex items-center gap-1"
                aria-label={`Network: ${isMainnet ? 'Ethereum Mainnet' : 'Wrong Network'}`}
              >
                {isMainnet ? (
                  <>
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    <span>Ethereum Mainnet</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3" aria-hidden="true" />
                    <span>Wrong Network</span>
                  </>
                )}
              </Badge>
              {chainId && (
                <span className="text-xs text-muted-foreground font-mono" aria-label="Chain ID">
                  Chain ID: {chainId}
                </span>
              )}
            </section>
          ) : (
            <Alert className="w-auto max-w-fit">
              <Wallet className="size-4" aria-hidden="true" />
              <AlertDescription>
                Connect your wallet to view on-chain wBTC contract details and your wBTC balance.
              </AlertDescription>
            </Alert>
          )}
        </section>

        {/* Network warning alert */}
        {isConnected && !isMainnet && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>
              Please switch to Ethereum Mainnet to interact with wBTC. wBTC is only available on
              Ethereum Mainnet (Chain ID: {mainnet.id}).
            </AlertDescription>
          </Alert>
        )}
      </nav>
    </header>
  )
}

