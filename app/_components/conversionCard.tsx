'use client'

import { useState, useEffect, useRef } from 'react'
import { useConnections, useChainId } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, ArrowLeftRight, Bitcoin, DollarSign, X, ArrowRightLeft } from 'lucide-react'
import type { AssetChainCombination } from '@/lib/assets-config'
import { BridgeForm } from './bridgeForm'
import { BridgeProgress } from './bridgeProgress'
import { useBridgeTransaction } from '@/hooks/useBridgeTransaction'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Image from 'next/image'
import {
  fetchTokenPrice,
  usdToToken,
  tokenToUsd,
  formatUsd,
  validateUsdInput,
  validateWbtcInput,
  parseInputValue,
} from '@/lib/conversion'
import { ConversionResult } from './conversionResult'
// Removed wbtcContractConfig import - now using selected asset-chain

const WBTC_ICON_URL =
  'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857'

type CurrencyMode = 'USD' | 'WBTC'

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
  
  // Bridge transaction state
  const { state: bridgeState, retryTransaction, resetTransaction } = useBridgeTransaction()
  const [showBridgeForm, setShowBridgeForm] = useState(false)

  // Get selected asset info or default to wBTC
  const selectedAsset = selectedAssetChain?.asset ?? null
  const assetSymbol = selectedAsset?.symbol ?? 'wBTC'
  const assetName = selectedAsset?.name ?? 'Wrapped Bitcoin'
  const assetIcon = selectedAsset?.icon ?? WBTC_ICON_URL

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('USD')
  const [inputValue, setInputValue] = useState('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [tokenPrice, setTokenPrice] = useState<number | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  // const [isConverting, setIsConverting] = useState(false) // Not needed with real-time conversion

  // Contract metadata is now read from selectedAssetChain config
  // No need for on-chain contract reads for metadata

  // Fetch token price based on selected asset's CoinGecko ID
  useEffect(() => {
    const loadPrice = async () => {
      if (!selectedAsset?.coingeckoId) {
        // Default to wrapped-bitcoin if no asset selected
        setIsLoadingPrice(true)
        setError(null)
        try {
          const price = await fetchTokenPrice('wrapped-bitcoin')
          setTokenPrice(price)
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch token price. Please try again.'
          )
        } finally {
          setIsLoadingPrice(false)
        }
        return
      }

      setIsLoadingPrice(true)
      setError(null)
      try {
        const price = await fetchTokenPrice(selectedAsset.coingeckoId)
        setTokenPrice(price)
      } catch (err) {
        setError(
          err instanceof Error 
            ? err.message 
            : `Failed to fetch ${assetSymbol} price. Please try again.`
        )
      } finally {
        setIsLoadingPrice(false)
      }
    }

    loadPrice()
  }, [selectedAsset?.coingeckoId, assetSymbol])

  // Real-time conversion as user types
  useEffect(() => {
    // Only convert if we have valid input, token price, and no input errors
    if (!inputValue || inputValue === '.' || inputError || !tokenPrice) {
      setConvertedAmount(null)
      // Notify parent of conversion state change
      onConversionChange?.({
        convertedAmount: null,
        currencyMode,
        inputValue,
        error: null,
      })
      return
    }

    const amount = parseInputValue(inputValue)
    if (amount === 0) {
      setConvertedAmount(null)
      onConversionChange?.({
        convertedAmount: null,
        currencyMode,
        inputValue,
        error: null,
      })
      return
    }

    try {
      let result: number | null = null
      if (currencyMode === 'USD') {
        const tokenAmount = usdToToken(amount, tokenPrice)
        setConvertedAmount(tokenAmount)
        result = tokenAmount
      } else {
        const usdAmount = tokenToUsd(amount, tokenPrice)
        setConvertedAmount(usdAmount)
        result = usdAmount
      }
      setError(null)
      // Notify parent of conversion result
      onConversionChange?.({
        convertedAmount: result,
        currencyMode,
        inputValue,
        error: null,
      })
    } catch {
      // Silently handle conversion errors for real-time updates
      setConvertedAmount(null)
      onConversionChange?.({
        convertedAmount: null,
        currencyMode,
        inputValue,
        error: null,
      })
    }
  }, [inputValue, tokenPrice, currencyMode, inputError, onConversionChange])

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

    // Validate based on currency mode
    const isValid =
      currencyMode === 'USD' ? validateUsdInput(cleaned) : validateWbtcInput(cleaned)

    // Show error if invalid characters were entered
    if (hasInvalidChars) {
      const maxDecimals = currencyMode === 'USD' ? 2 : 8
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
      const maxDecimals = currencyMode === 'USD' ? 2 : 8
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
    const newCurrencyMode = currencyMode === 'USD' ? 'WBTC' : 'USD'
    setCurrencyMode(newCurrencyMode)
    
    // If there's input value, keep it and let real-time conversion handle the conversion
    // Validate input for the new currency mode
    if (inputValue && inputValue !== '.') {
      const isValid = newCurrencyMode === 'USD' ? validateUsdInput(inputValue) : validateWbtcInput(inputValue)
      if (!isValid) {
        const maxDecimals = newCurrencyMode === 'USD' ? 2 : 8
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
  //     : 'Enter amount in wBTC (max 8 decimals)'

  // Get decimal hint based on selected asset
  const assetDecimals = selectedAsset?.decimals ?? 8
  const decimalHint =
    currencyMode === 'USD'
      ? 'Maximum 2 decimal places'
      : `Maximum ${assetDecimals} decimal places`

  // Dynamic title and description based on currency mode and selected asset
  const cardTitle = `Convert to ${currencyMode === 'USD' ? assetSymbol : 'USD'}`
  const cardDescription =
    currencyMode === 'USD'
      ? `Enter USD amount to convert to ${assetName} (${assetSymbol}) using real-time market prices`
      : `Enter ${assetSymbol} amount to convert to USD using real-time market prices`

  return (
    <Card className="w-full max-w-xl mx-auto border-none shadow-none bg-zinc-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {currencyMode === 'USD' ? (
            <Bitcoin className="size-5" aria-hidden="true" />
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
              Amount ({currencyMode})
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
                  aria-label={`Enter amount in ${currencyMode}`}
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
                {currencyMode === 'USD' && (
                  <section
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-full bg-muted border"
                    aria-hidden="true"
                  >
                    <DollarSign className="size-4 text-foreground" />
                  </section>
                )}
                {currencyMode !== 'USD' && selectedAsset && (
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
                    aria-label={`Switch to ${currencyMode === 'USD' ? 'wBTC' : 'USD'} input mode`}
                    className="shrink-0 h-12 w-12 md:h-9 md:w-9 p-0"
                  >
                    <ArrowLeftRight className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {currencyMode === 'USD'
                      ? 'Switch to wBTC input mode to convert to USD'
                      : 'Switch to USD input mode to convert to wBTC'}
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
            {currencyMode === 'USD' ? (
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
          <section className="flex items-center justify-between">
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

          {showBridgeForm && (
            <section className="space-y-4">
              <BridgeForm 
                selectedAssetChain={selectedAssetChain ?? null}
                onBridgeSuccess={() => {
                  // Optionally handle success
                }}
              />
              {bridgeState.status !== 'idle' && (
                <BridgeProgress 
                  state={bridgeState}
                  onRetry={retryTransaction}
                  onReset={() => {
                    resetTransaction()
                    setShowBridgeForm(false)
                  }}
                />
              )}
            </section>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

