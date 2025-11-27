'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useConnections, useChainId } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, ArrowLeftRight, DollarSign, X, ArrowRightLeft } from 'lucide-react'
import type { AssetChainCombination } from '@/lib/assets-config'
import { BridgeForm } from './bridgeForm'
import { useBridgeTransaction } from '@/hooks/useBridgeTransaction'
import { motion, AnimatePresence } from 'motion/react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Image from 'next/image'
import {
  usdToToken,
  tokenToUsd,
  formatUsd,
  validateUsdInput,
  validateTokenInput,
  parseInputValue,
} from '@/lib/conversion'
import { ConversionResult } from './conversionResult'
import { useTokenPrices } from '@/hooks/useTokenPrices'
// Removed wbtcContractConfig import - now using selected asset-chain

type CurrencyMode = 'USD' | 'TOKEN'

interface ConversionCardProps {
  selectedAssetChain?: AssetChainCombination | null
  onConversionChange?: (data: {
    convertedAmount: number | null
    currencyMode: CurrencyMode
    inputValue: string
    error: string | null
  }) => void
  onInputFocus?: (inputElement: HTMLInputElement | null, cardContentElement: HTMLDivElement | null) => void
}

/**
 * ConversionCard Component
 * Main conversion interface for USD <-> Multi-Asset conversion
 * Includes bridge transaction functionality
 */
export function ConversionCard({ selectedAssetChain, onConversionChange, onInputFocus }: ConversionCardProps = {}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cardContentRef = useRef<HTMLDivElement>(null)
  const connections = useConnections()
  const isConnected = connections.length > 0
  const chainId = useChainId()
  
  // Bridge transaction state - lifted to card level so BridgeForm and BridgeProgress share state
  const { 
    state: bridgeState, 
    submitTransaction, 
    retryTransaction, 
    resetTransaction, 
    isSubmitting,
    error: bridgeError 
  } = useBridgeTransaction()
  const [showBridgeForm, setShowBridgeForm] = useState(false)

  // Get selected asset info or default to wBTC
  const selectedAsset = selectedAssetChain?.asset ?? null
  const assetSymbol = selectedAsset?.symbol ?? 'wBTC'
  const assetName = selectedAsset?.name ?? 'Wrapped Bitcoin'
  const assetIcon = selectedAsset?.icon ?? 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857'
  const assetDecimals = selectedAsset?.decimals ?? 8

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('USD')
  
  // Determine if we're converting TO token or FROM token
  const isConvertingToToken = currencyMode === 'USD'
  const isConvertingFromToken = currencyMode === 'TOKEN'
  const [inputValue, setInputValue] = useState('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  // const [isConverting, setIsConverting] = useState(false) // Not needed with real-time conversion

  // Contract metadata is now read from selectedAssetChain config
  // No need for on-chain contract reads for metadata

  // Fetch token prices using TanStack Query hook (with caching)
  const coingeckoId = selectedAsset?.coingeckoId ?? 'wrapped-bitcoin'
  const { prices, isLoading: isLoadingPrice, error: priceError } = useTokenPrices([coingeckoId])
  
  // Get the price for the selected asset
  const tokenPrice = prices[coingeckoId] ?? null

  // Set error if price fetch failed - use derived state to avoid React Compiler warning
  const priceErrorMessage = useMemo(() => {
    if (priceError) {
      return priceError instanceof Error 
        ? priceError.message 
        : `Failed to fetch ${assetSymbol} price. Please try again.`
    }
    if (tokenPrice === null && !isLoadingPrice && selectedAsset?.coingeckoId) {
      return `Failed to fetch ${assetSymbol} price. Please try again.`
    }
    return null
  }, [priceError, tokenPrice, isLoadingPrice, selectedAsset?.coingeckoId, assetSymbol])

  useEffect(() => {
    setError(priceErrorMessage)
  }, [priceErrorMessage])

  // Real-time conversion as user types - use useMemo to calculate, then sync to state
  const calculatedConvertedAmount = useMemo(() => {
    // Only convert if we have valid input, token price, and no input errors
    if (!inputValue || inputValue === '.' || inputError || !tokenPrice) {
      return null
    }

    const amount = parseInputValue(inputValue)
    if (amount === 0) {
      return null
    }

    try {
      if (isConvertingToToken) {
        // Converting USD to selected token
        return usdToToken(amount, tokenPrice)
      } else {
        // Converting selected token to USD
        return tokenToUsd(amount, tokenPrice)
      }
    } catch {
      return null
    }
  }, [inputValue, tokenPrice, inputError, isConvertingToToken])

  // Sync calculated amount to state and notify parent
  useEffect(() => {
    const syncAmount = () => {
      setConvertedAmount(calculatedConvertedAmount)
      onConversionChange?.({
        convertedAmount: calculatedConvertedAmount,
        currencyMode,
        inputValue,
        error: null,
      })
    }
    
    // Use setTimeout to avoid React Compiler warning about synchronous setState
    const timeoutId = setTimeout(syncAmount, 0)
    return () => clearTimeout(timeoutId)
  }, [calculatedConvertedAmount, currencyMode, inputValue, onConversionChange])

  // Notify parent when error changes
  useEffect(() => {
    onConversionChange?.({
      convertedAmount,
      currencyMode,
      inputValue,
      error,
    })
  }, [error, convertedAmount, currencyMode, inputValue, onConversionChange])

  // Handle input change with validation
  const handleInputChange = (value: string) => {
    // Check if value contains invalid characters (non-numeric, non-decimal)
    const hasInvalidChars = /[^\d.]/.test(value)
    
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')

    // Validate based on currency mode and asset decimals
    const maxDecimals = isConvertingToToken ? 2 : assetDecimals
    const isValid =
      isConvertingToToken ? validateUsdInput(cleaned) : validateTokenInput(cleaned, assetDecimals)

    // Show error if invalid characters were entered
    if (hasInvalidChars) {
      setInputError(
        `Only numbers and decimal point allowed. Maximum ${maxDecimals} decimal place${maxDecimals > 1 ? 's' : ''}.`
      )
      // Still update the input with cleaned value
      setInputValue(cleaned)
      setError(null)
    } else if (isValid) {
      setInputValue(cleaned)
      setInputError(null)
      setError(null)
    } else if (cleaned !== '' && cleaned !== '.') {
      // Show error for invalid decimal format
      setInputError(
        `Invalid format. Please enter a number with up to ${maxDecimals} decimal place${maxDecimals > 1 ? 's' : ''}.`
      )
      setInputValue(cleaned)
    } else {
      setInputValue(cleaned)
      setInputError(null)
    }
  }

  // Handle conversion - Commented out: Real-time conversion handles this automatically
  // const handleConvert = async () => {
  //   if (!inputValue || parseInputValue(inputValue) === 0) {
  //     setError('Please enter a valid amount')
  //     return
  //   }

  //   if (!btcPrice) {
  //     setError('Bitcoin price not available. Please try again.')
  //     return
  //   }

  //   setIsConverting(true)
  //   setError(null)

  //   try {
  //     const amount = parseInputValue(inputValue)

  //     if (currencyMode === 'USD') {
  //       const wbtcAmount = usdToWbtc(amount, btcPrice)
  //       setConvertedAmount(wbtcAmount)
  //     } else {
  //       const usdAmount = wbtcToUsd(amount, btcPrice)
  //       setConvertedAmount(usdAmount)
  //     }
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : 'Conversion failed. Please try again.'
  //     )
  //   } finally {
  //     setIsConverting(false)
  //   }
  // }

  // Handle currency toggle
  const handleToggleCurrency = () => {
    const newCurrencyMode = currencyMode === 'USD' ? 'TOKEN' : 'USD'
    setCurrencyMode(newCurrencyMode)
    
    // If there's input value, keep it and let real-time conversion handle the conversion
    // Validate input for the new currency mode
    if (inputValue && inputValue !== '.') {
      const maxDecimals = newCurrencyMode === 'USD' ? 2 : assetDecimals
      const isValid = newCurrencyMode === 'USD' ? validateUsdInput(inputValue) : validateTokenInput(inputValue, assetDecimals)
      if (!isValid) {
        setInputError(
          `Invalid format for ${newCurrencyMode}. Please enter a number with up to ${maxDecimals} decimal place${maxDecimals > 1 ? 's' : ''}.`
        )
      } else {
        setInputError(null)
      }
    } else {
      setConvertedAmount(null)
    }
    // Clear general errors - real-time conversion will handle conversion
    setError(null)
  }

  // Handle clear input
  const handleClearInput = () => {
    setInputValue('')
    setConvertedAmount(null)
    setError(null)
    setInputError(null)
  }

  // Check if input is disabled - only disable when loading price
  // Conversion works without wallet connection (wallet only needed for optional on-chain features)
  const isInputDisabled = isLoadingPrice

  // Get placeholder text
  // const placeholderText =
  //   currencyMode === 'USD'
  //     ? 'Enter amount in USD (max 2 decimals)'
  //     : `Enter amount in ${assetSymbol} (max ${assetDecimals} decimals)`

  // Get decimal hint based on selected asset
  const decimalHint =
    currencyMode === 'USD'
      ? 'Maximum 2 decimal places'
      : `Maximum ${assetDecimals} decimal places`

  // Dynamic title and description based on currency mode and selected asset
  const cardTitle = `Convert to ${isConvertingToToken ? assetSymbol : 'USD'}`
  const cardDescription =
    isConvertingToToken
      ? `Enter USD amount to convert to ${assetName} (${assetSymbol}) using real-time market prices`
      : `Enter ${assetSymbol} amount to convert to USD using real-time market prices`

  return (
    <Card className="w-full max-w-xl mx-auto border-none shadow-none bg-zinc-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConvertingToToken ? (
            <Image
              src={assetIcon}
              alt={`${assetSymbol} icon`}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <DollarSign className="size-5" aria-hidden="true" />
          )}
          {cardTitle}
        </CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent ref={cardContentRef} className="space-y-6">
        {/* Input section */}
        <section className="space-y-5">
          <section className="space-y-2">
            <Label htmlFor="amount-input" className="flex flex-col items-start gap-2">
              Amount ({isConvertingToToken ? 'USD' : assetSymbol})
              <span className="text-xs text-muted-foreground">({decimalHint})</span>
            </Label>
            <section className="flex flex-row items-center gap-3">
              <section className="relative flex-1">
                <Input
                  ref={inputRef}
                  id="amount-input"
                  type="text"
                  inputMode="decimal"
                  // placeholder={placeholderText}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => onInputFocus?.(inputRef.current, cardContentRef.current)}
                  disabled={isInputDisabled}
                  aria-label={`Enter amount in ${isConvertingToToken ? 'USD' : assetSymbol}`}
                  aria-describedby="decimal-hint"
                  className="h-12 md:h-9 pr-12 bg-white"
                />
                {/* Clear button - shows when there's input value */}
                {inputValue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearInput}
                    aria-label="Clear input"
                    className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                )}
                {isConvertingToToken && (
                  <section
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-full bg-muted border"
                    aria-hidden="true"
                  >
                    <DollarSign className="size-4 text-foreground" />
                  </section>
                )}
                {isConvertingFromToken && selectedAsset && (
                  <section
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <Image
                      src={assetIcon}
                      alt={`${assetSymbol} icon`}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </section>
                )}
              </section>

              {/* Toggle button - same height as input */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleCurrency}
                    aria-label={`Switch to ${isConvertingToToken ? assetSymbol : 'USD'} input mode`}
                    className="shrink-0 h-12 w-12 md:h-9 md:w-9 p-0"
                  >
                    <ArrowLeftRight className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isConvertingToToken
                      ? `Switch to ${assetSymbol} input mode to convert to USD`
                      : `Switch to USD input mode to convert to ${assetSymbol}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </section>
            {/* Input validation error */}
            {inputError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>{inputError}</AlertDescription>
              </Alert>
            )}
          </section>

          {/* Conversion result */}
          <ConversionResult
            convertedAmount={convertedAmount}
            currencyMode={currencyMode}
            inputValue={inputValue}
            error={error}
            assetSymbol={assetSymbol}
            assetDecimals={selectedAsset?.decimals ?? 8}
          />

          {/* Convert button - Commented out: Real-time conversion makes button redundant */}
          {/* <Button
            type="button"
            onClick={handleConvert}
            disabled={isInputDisabled || !inputValue || isConverting}
            className="w-full h-12 rounded-full"
            aria-label="Convert currency"
          >
            {isConverting ? (
              <>
                <Spinner className="mr-2 size-4" aria-hidden="true" />
                Converting...
              </>
            ) : (
              `Convert to ${currencyMode === 'USD' ? 'wBTC' : 'USD'}`
            )}
          </Button> */}
        </section>

        {/* Loading indicator for price */}
        {isLoadingPrice && (
          <Alert>
            <Spinner className="size-4" aria-hidden="true" />
            <AlertDescription>Fetching current Bitcoin price...</AlertDescription>
          </Alert>
        )}

        {/* Price display */}
        {tokenPrice && !isLoadingPrice && selectedAsset && (
          <section className="text-left">
            <p className="text-sm text-muted-foreground">
              1 {assetSymbol} ≈ <span className="font-medium">{formatUsd(tokenPrice)}</span>
            </p>
          </section>
        )}


        {/* Error messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet connection info - optional for enhanced features */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>
              Connect your wallet to view on-chain contract details and your token balances.
            </AlertDescription>
          </Alert>
        )}

        {/* Network mismatch warning - handled at page level now */}

        {/* Contract metadata display */}
        {isConnected && selectedAssetChain && selectedAsset && chainId === selectedAssetChain.chainId && (
          <section className="text-xs text-muted-foreground space-y-1">
            {isConvertingToToken ? (
              // Show selected asset contract info when converting TO asset
              <>
                <p>
                  Token Symbol: <span className="font-mono font-medium">{selectedAsset.symbol}</span>
                </p>
                <p>
                  Decimals: <span className="font-mono font-medium">{selectedAsset.decimals}</span>
                </p>
                <p>
                  Chain: <span className="font-mono font-medium">{selectedAssetChain.chain.name}</span>
                </p>
              </>
            ) : (
              // Show USD info when converting TO USD
              <>
                <p>
                  Currency: <span className="font-mono font-medium">USD</span>
                </p>
                <p>
                  Decimals: <span className="font-mono font-medium">2</span>
                </p>
              </>
            )}
          </section>
        )}

        {/* Bridge Transaction Section */}
        <section className="space-y-4 border-t pt-4">
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold">Bridge Transaction</h3>
            <Button
              type="button"
              variant={showBridgeForm ? 'outline' : 'default'}
              className="h-12 md:h-9"
              onClick={() => {
                setShowBridgeForm(!showBridgeForm)
                if (showBridgeForm) {
                  resetTransaction()
                }
              }}
              aria-label={showBridgeForm ? 'Hide bridge form' : 'Show bridge form'}
            >
              <ArrowRightLeft className="size-4 mr-2" aria-hidden="true" />
              {showBridgeForm ? 'Hide Bridge' : 'Bridge Tokens'}
            </Button>
          </section>

          <AnimatePresence mode="wait">
            {showBridgeForm && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-4 overflow-hidden"
              >
                <BridgeForm 
                  selectedAssetChain={selectedAssetChain ?? null}
                  bridgeState={bridgeState}
                  isSubmitting={isSubmitting}
                  bridgeError={bridgeError}
                  onSubmit={submitTransaction}
                  onRetry={retryTransaction}
                  onReset={() => {
                    resetTransaction()
                    // Reset form fields will be handled by BridgeForm's handleReset
                  }}
                  onBridgeSuccess={() => {
                    // Optionally handle success
                  }}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </section>
      </CardContent>
    </Card>
  )
}

