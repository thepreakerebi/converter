'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { bridgeFormSchema, type BridgeFormData } from '@/lib/bridge-schema'
import type { AssetChainCombination } from '@/lib/assets-config'
import { supportedChains } from '@/lib/wagmi.config'
import { useMemo } from 'react'
import type { BridgeState } from '@/lib/bridge-state-machine'
import { BridgeProgress } from './bridgeProgress'

/**
 * BridgeForm Component
 * Form for initiating bridge transactions between chains
 * Includes: source chain, destination chain, asset, amount, recipient address
 */
export interface BridgeFormProps {
  selectedAssetChain: AssetChainCombination | null
  bridgeState: BridgeState
  isSubmitting: boolean
  bridgeError: string | null
  onSubmit: (data: BridgeFormData) => Promise<void>
  onReset: () => void
  onRetry?: () => Promise<void>
  onBridgeSuccess?: () => void
}

export function BridgeForm({ 
  selectedAssetChain, 
  bridgeState,
  isSubmitting,
  bridgeError,
  onSubmit,
  onReset,
  onRetry,
  onBridgeSuccess 
}: BridgeFormProps) {
  const { address } = useAccount()

  // Get all available destination chains (exclude source chain)
  const availableDestinationChains = useMemo(() => {
    if (!selectedAssetChain) return supportedChains
    return supportedChains.filter((chain) => chain.id !== selectedAssetChain.chainId)
  }, [selectedAssetChain])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BridgeFormData>({
    resolver: zodResolver(bridgeFormSchema),
    defaultValues: {
      sourceChain: selectedAssetChain?.chainId ?? 1,
      destinationChain: availableDestinationChains[0]?.id ?? 1,
      asset: selectedAssetChain?.assetId ?? 'wbtc',
      amount: '',
      recipientAddress: address ?? '',
    },
  })

  // Watch form values for dynamic updates
  const destinationChain = watch('destinationChain')

  // Update form when selectedAssetChain changes
  useMemo(() => {
    if (selectedAssetChain) {
      setValue('sourceChain', selectedAssetChain.chainId)
      setValue('asset', selectedAssetChain.assetId)
      
      // Update destination chain if it's the same as source
      if (destinationChain === selectedAssetChain.chainId) {
        const newDestination = availableDestinationChains.find(
          (chain) => chain.id !== selectedAssetChain.chainId
        )
        if (newDestination) {
          setValue('destinationChain', newDestination.id)
        }
      }
    }
  }, [selectedAssetChain, setValue, destinationChain, availableDestinationChains])

  // Update recipient address when wallet connects
  useMemo(() => {
    if (address && !watch('recipientAddress')) {
      setValue('recipientAddress', address)
    }
  }, [address, setValue, watch])

  const onFormSubmit = async (data: BridgeFormData) => {
    await onSubmit(data)
    if (bridgeState.status === 'confirmed') {
      onBridgeSuccess?.()
    }
  }

  // Handle reset - clears form fields and transaction state
  const handleReset = () => {
    onReset()
    // Reset amount and recipient address fields
    setValue('amount', '')
    setValue('recipientAddress', address ?? '')
  }

  // Get asset symbol
  const assetSymbol = selectedAssetChain?.asset.symbol ?? 'Token'

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Source Chain (read-only, from selected asset-chain) */}
      <section className="space-y-2">
        <Label htmlFor="source-chain">Source Chain</Label>
        <Input
          id="source-chain"
          value={selectedAssetChain ? `${selectedAssetChain.chain.name} (${assetSymbol})` : 'Select asset-chain first'}
          disabled
          className="h-12 md:h-9 bg-muted"
          aria-label="Source chain (read-only)"
        />
        <p className="text-xs text-muted-foreground">
          Source chain is determined by your selected asset-chain combination
        </p>
      </section>

      {/* Destination Chain */}
      <section className="space-y-2">
        <Label htmlFor="destination-chain">
          Destination Chain <span className="text-destructive">*</span>
        </Label>
        <Select
          value={destinationChain?.toString()}
          onValueChange={(value) => setValue('destinationChain', Number(value))}
          disabled={isSubmitting || !selectedAssetChain}
        >
          <SelectTrigger id="destination-chain" aria-label="Select destination chain" className="h-12 md:h-9">
            <SelectValue placeholder="Select destination chain" />
          </SelectTrigger>
          <SelectContent>
            {availableDestinationChains.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.destinationChain && (
          <p className="text-xs text-destructive">{errors.destinationChain.message}</p>
        )}
      </section>

      {/* Asset (read-only, from selected asset-chain) */}
      <section className="space-y-2">
        <Label htmlFor="asset">Asset</Label>
        <Input
          id="asset"
          value={selectedAssetChain ? `${selectedAssetChain.asset.symbol} (${selectedAssetChain.asset.name})` : 'Select asset-chain first'}
          disabled
          className="h-12 md:h-9 bg-muted"
          aria-label="Asset (read-only)"
        />
        <p className="text-xs text-muted-foreground">
          Asset is determined by your selected asset-chain combination
        </p>
      </section>

      {/* Amount */}
      <section className="space-y-2">
        <Label htmlFor="bridge-amount">
          Amount ({assetSymbol}) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="bridge-amount"
          type="text"
          inputMode="decimal"
          placeholder={`Enter amount in ${assetSymbol}`}
          {...register('amount')}
          disabled={isSubmitting || !selectedAssetChain}
          className="h-12 md:h-9"
          aria-label={`Amount in ${assetSymbol}`}
          aria-invalid={!!errors.amount}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </section>

      {/* Recipient Address */}
      <section className="space-y-2">
        <Label htmlFor="recipient-address">
          Recipient Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="recipient-address"
          type="text"
          placeholder="0x..."
          {...register('recipientAddress')}
          disabled={isSubmitting}
          className="h-12 md:h-9"
          aria-label="Recipient wallet address"
          aria-invalid={!!errors.recipientAddress}
        />
        {errors.recipientAddress && (
          <p className="text-xs text-destructive">{errors.recipientAddress.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {address 
            ? 'Pre-filled with your connected wallet address. You can change it if needed.'
            : 'Enter the wallet address on the destination chain that will receive the tokens.'}
        </p>
      </section>

      {/* Bridge Transaction Errors */}
      {bridgeError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertDescription>{bridgeError}</AlertDescription>
        </Alert>
      )}

      {/* Estimated Fees and Time (mocked) */}
      <Alert>
        <AlertCircle className="size-4" aria-hidden="true" />
        <AlertDescription className="text-xs">
          <div className="space-y-1">
            <p className="whitespace-nowrap">
              <strong>Estimated Fees:</strong> ~$2-5 USD
            </p>
            <p className="whitespace-nowrap">
              <strong>Estimated Arrival Time:</strong> 5-15 minutes
            </p>
            <p className="text-muted-foreground">
              These are mock estimates. Actual fees and times may vary.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Stepper - Show when transaction is in progress (replaces submit button) */}
      {bridgeState.status !== 'idle' ? (
        <BridgeProgress 
          state={bridgeState}
          onRetry={onRetry}
          onReset={handleReset}
        />
      ) : (
        /* Submit Button - Show when idle (hidden when transaction starts) */
        <section className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || !selectedAssetChain}
            className="flex-1 h-12 md:h-9"
            aria-label="Submit bridge transaction"
          >
            Bridge Tokens
          </Button>
        </section>
      )}

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertDescription>
            Please fix the errors above before submitting.
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}

