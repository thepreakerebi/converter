'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { chains } from '@/lib/wagmi.config'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * ChainStatusBadge Component
 * Displays current chain status with color-coded badge
 * Shows "Change Network" button for unsupported chains that switches to Ethereum Mainnet
 */
export function ChainStatusBadge() {
  const {
    chainId,
    isSupportedChain,
    currentChain,
    changeNetwork,
    isSwitchingChain,
    switchError,
    switchAttempted,
  } = useWalletStatus()

  // Get chain name even if unsupported (from wagmi's full chains array)
  const getChainName = () => {
    if (!chainId) return null
    if (currentChain) return currentChain.name
    // Find chain in wagmi's full chains array even if not in supportedChains
    return chains.find((chain) => chain.id === chainId)?.name ?? null
  }

  const chainName = getChainName()

  // Determine badge variant and content based on chain status
  const getBadgeContent = () => {
    if (!chainId) {
      return {
        variant: 'outline' as const,
        icon: <AlertCircle className="size-3" aria-hidden="true" />,
        text: 'No Network',
        color: 'text-muted-foreground',
      }
    }

    if (isSupportedChain && currentChain) {
      return {
        variant: 'default' as const,
        icon: <CheckCircle2 className="size-3" aria-hidden="true" />,
        text: currentChain.name,
        color: 'text-primary-foreground',
      }
    }

    // Unsupported chain - show network name if available
    const unsupportedText = chainName 
      ? `Unsupported Network: ${chainName}`
      : 'Unsupported Network'

    return {
      variant: 'destructive' as const,
      icon: <AlertCircle className="size-3" aria-hidden="true" />,
      text: unsupportedText,
      color: 'text-white',
    }
  }

  const badgeContent = getBadgeContent()

  return (
    <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Badge
        variant={badgeContent.variant}
        className="flex items-center gap-1 w-fit"
        aria-label={`Network: ${badgeContent.text}`}
      >
        {badgeContent.icon}
        <span>{badgeContent.text}</span>
      </Badge>

      {chainId && !isSupportedChain && (
        <>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={changeNetwork}
            disabled={isSwitchingChain}
            aria-label="Switch to Ethereum Mainnet"
            className="flex items-center gap-1"
          >
            {isSwitchingChain ? (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                <span>Switching...</span>
              </>
            ) : (
              <span>Change Network</span>
            )}
          </Button>
          {switchError && switchAttempted && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription className="text-xs">
                {switchError.message || 'Unable to switch network automatically. Please switch to Ethereum Mainnet or Sepolia in your wallet.'}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </section>
  )
}

