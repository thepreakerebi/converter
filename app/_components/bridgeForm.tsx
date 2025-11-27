'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAccount, usePublicClient } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { bridgeFormSchema, type BridgeFormData } from '@/lib/bridge-schema'
import type { AssetChainCombination } from '@/lib/assets-config'
import { supportedChains } from '@/lib/wagmi.config'
import { useMemo, useState, useEffect } from 'react'
import type { BridgeState } from '@/lib/bridge-state-machine'
import { BridgeProgress } from './bridgeProgress'
import { isAddress } from 'viem'

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
  const [contractAddressError, setContractAddressError] = useState<string | null>(null)
  const [isCheckingAddress, setIsCheckingAddress] = useState(false)

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
  const recipientAddress = watch('recipientAddress')
  
  // Get public client for the destination chain
  // usePublicClient returns undefined if chainId is not configured in wagmi
  const publicClient = usePublicClient({ chainId: destinationChain })
  
  // Debug: Log when public client is not available
  useEffect(() => {
    if (destinationChain && !publicClient) {
      console.warn(`Public client not available for destination chain ${destinationChain}. Make sure the chain is configured in wagmi.config.ts with a transport.`)
    }
  }, [destinationChain, publicClient])

  // Check if recipient address is a contract address
  useEffect(() => {
    const checkContractAddress = async () => {
      // Reset error
      setContractAddressError(null)
      
      // Skip if address is empty or invalid format
      if (!recipientAddress || !isAddress(recipientAddress)) {
        return
      }

      // Skip if address is the zero address
      if (recipientAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        return
      }

      // Skip if no destination chain
      if (!destinationChain) {
        return
      }

      // Check if public client is available
      if (!publicClient) {
        console.warn(`Public client not available for chain ${destinationChain}. Cannot check if address is contract.`)
        // Still show a warning but don't block - this is a fallback
        return
      }

      setIsCheckingAddress(true)
      try {
        // Get the code at the address - if it has code, it's a contract
        // According to viem docs: returns '0x' or '0x0' for EOA, bytecode for contracts
        const code = await publicClient.getCode({
          address: recipientAddress as `0x${string}`,
        })

        // Check if code exists and is not empty (EOA returns '0x' or '0x0')
        const hasCode = code && code !== '0x' && code !== '0x0' && code.length > 2
        
        if (hasCode) {
          setContractAddressError('Recipient address is a contract address. Please use a wallet address (EOA) instead.')
          console.log('Contract detected:', { address: recipientAddress, codeLength: code.length })
        } else {
          // Explicitly clear error if it's an EOA
          setContractAddressError(null)
        }
      } catch (error) {
        // Log the error for debugging
        console.error('Failed to check if address is contract:', error)
        // Don't block user on network errors, but log for debugging
        // In production, you might want to show a warning
      } finally {
        setIsCheckingAddress(false)
      }
    }

    // Debounce the check
    const timeoutId = setTimeout(() => {
      checkContractAddress()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [recipientAddress, destinationChain, publicClient])

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
    // Block submission if contract address error exists
    if (contractAddressError) {
      console.error('Form submission blocked: Contract address detected')
      return
    }
    
    // Additional check: if we're still checking, wait a bit
    if (isCheckingAddress) {
      console.warn('Form submission attempted while checking address, waiting...')
      // Wait for check to complete (max 2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      if (contractAddressError) {
        console.error('Form submission blocked after wait: Contract address detected')
        return
      }
    }
    
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
    // Clear contract address error
    setContractAddressError(null)
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
        {contractAddressError && (
          <p className="text-xs text-destructive">{contractAddressError}</p>
        )}
        {isCheckingAddress && (
          <p className="text-xs text-muted-foreground">Checking address...</p>
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
      
      {/* Contract Address Error Alert */}
      {contractAddressError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertDescription>{contractAddressError}</AlertDescription>
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
            disabled={isSubmitting || !selectedAssetChain || !!contractAddressError}
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

