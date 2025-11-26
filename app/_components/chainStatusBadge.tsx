'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * ChainStatusBadge Component
 * Displays current chain status with color-coded badge
 * Shows retry button for unsupported chains
 */
export function ChainStatusBadge() {
  const { chainId, isSupportedChain, currentChain, retryDetection } = useWalletStatus()

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

    return {
      variant: 'destructive' as const,
      icon: <AlertCircle className="size-3" aria-hidden="true" />,
      text: 'Unsupported Network',
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

      {chainId && (
        <span className="text-xs text-muted-foreground font-mono" aria-label="Chain ID">
          Chain ID: {chainId}
        </span>
      )}

      {chainId && !isSupportedChain && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={retryDetection}
          aria-label="Retry network detection"
          className="flex items-center gap-1"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          <span>Retry Detection</span>
        </Button>
      )}
    </section>
  )
}

