'use client'

import { useState, useEffect } from 'react'
import { useConnections, useChainId } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, ArrowLeftRight, Bitcoin, DollarSign } from 'lucide-react'
import Image from 'next/image'
import {
  fetchBitcoinPrice,
  usdToWbtc,
  wbtcToUsd,
  formatUsd,
  formatWbtc,
  validateUsdInput,
  validateWbtcInput,
  parseInputValue,
} from '@/lib/conversion'
import { wbtcContractConfig, WBTC_FUNCTIONS } from '@/lib/wbtc-contract'

const WBTC_ICON_URL =
  'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857'

type CurrencyMode = 'USD' | 'WBTC'

/**
 * ConversionCard Component
 * Main conversion interface for USD <-> wBTC conversion
 */
export function ConversionCard() {
  const connections = useConnections()
  const isConnected = connections.length > 0
  const chainId = useChainId()
  // Check if chain is Ethereum Mainnet
  // If chainId is undefined, it might be a non-EVM chain (like Solana) that wagmi doesn't support
  const isMainnet = chainId === mainnet.id
  // Show error if connected but not on mainnet, or if chainId is undefined (non-EVM chain)
  const isWrongNetwork = isConnected && (!isMainnet || chainId === undefined)

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('USD')
  const [inputValue, setInputValue] = useState('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  // const [isConverting, setIsConverting] = useState(false) // Not needed with real-time conversion

  // Read wBTC contract metadata
  const { data: wbtcSymbol, isLoading: isLoadingSymbol } = useReadContract({
    ...wbtcContractConfig,
    functionName: WBTC_FUNCTIONS.symbol,
    query: {
      enabled: isConnected && isMainnet,
    },
  })

  const { data: wbtcDecimals, isLoading: isLoadingDecimals } = useReadContract({
    ...wbtcContractConfig,
    functionName: WBTC_FUNCTIONS.decimals,
    query: {
      enabled: isConnected && isMainnet,
    },
  })

  // Fetch BTC price on mount and when switching modes
  useEffect(() => {
    const loadPrice = async () => {
      setIsLoadingPrice(true)
      setError(null)
      try {
        const price = await fetchBitcoinPrice()
        setBtcPrice(price)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch Bitcoin price. Please try again.'
        )
      } finally {
        setIsLoadingPrice(false)
      }
    }

    loadPrice()
  }, [])

  // Real-time conversion as user types
  useEffect(() => {
    // Only convert if we have valid input, BTC price, and no input errors
    if (!inputValue || inputValue === '.' || inputError || !btcPrice) {
      setConvertedAmount(null)
      return
    }

    const amount = parseInputValue(inputValue)
    if (amount === 0) {
      setConvertedAmount(null)
      return
    }

    try {
      if (currencyMode === 'USD') {
        const wbtcAmount = usdToWbtc(amount, btcPrice)
        setConvertedAmount(wbtcAmount)
      } else {
        const usdAmount = wbtcToUsd(amount, btcPrice)
        setConvertedAmount(usdAmount)
      }
      setError(null)
    } catch {
      // Silently handle conversion errors for real-time updates
      setConvertedAmount(null)
    }
  }, [inputValue, btcPrice, currencyMode, inputError])

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
    setCurrencyMode(currencyMode === 'USD' ? 'WBTC' : 'USD')
    setInputValue('')
    setConvertedAmount(null)
    setError(null)
    setInputError(null)
  }

  // Check if input is disabled
  const isInputDisabled = !isConnected || !isMainnet || isLoadingPrice

  // Get placeholder text
  // const placeholderText =
  //   currencyMode === 'USD'
  //     ? 'Enter amount in USD (max 2 decimals)'
  //     : 'Enter amount in wBTC (max 8 decimals)'

  // Get decimal hint
  const decimalHint =
    currencyMode === 'USD'
      ? 'Maximum 2 decimal places'
      : 'Maximum 8 decimal places'

  // Dynamic title and description based on currency mode
  const cardTitle = `Convert to ${currencyMode === 'USD' ? 'wBTC' : 'USD'}`
  const cardDescription =
    currencyMode === 'USD'
      ? 'Enter USD amount to convert to Wrapped Bitcoin (wBTC) using real-time market prices'
      : 'Enter wBTC amount to convert to USD using real-time market prices'

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
      <CardContent className="space-y-6">
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
                  id="amount-input"
                  type="text"
                  inputMode="decimal"
                  // placeholder={placeholderText}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  disabled={isInputDisabled}
                  aria-label={`Enter amount in ${currencyMode}`}
                  aria-describedby="decimal-hint"
                  className="pr-12 bg-white"
                />
                {currencyMode === 'USD' && (
                  <section
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-full bg-muted border"
                    aria-hidden="true"
                  >
                    <DollarSign className="size-4 text-foreground" />
                  </section>
                )}
                {currencyMode === 'WBTC' && (
                  <section
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <Image
                      src={WBTC_ICON_URL}
                      alt="wBTC icon"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </section>
                )}
              </section>

              {/* Toggle button - same height as input */}
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleCurrency}
                aria-label={`Switch to ${currencyMode === 'USD' ? 'wBTC' : 'USD'} input mode`}
                className="shrink-0 h-9 w-9 p-0"
              >
                <ArrowLeftRight className="size-4" aria-hidden="true" />
              </Button>
            </section>
            {/* Input validation error */}
            {inputError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>{inputError}</AlertDescription>
              </Alert>
            )}
          </section>

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
        {btcPrice && !isLoadingPrice && (
          <section className="text-center">
            <p className="text-sm text-muted-foreground">
              Current BTC Price: <span className="font-medium">{formatUsd(btcPrice)}</span>
            </p>
          </section>
        )}

        {/* Conversion result */}
        {convertedAmount !== null && !error && (
          <section className="rounded-lg border-2 border-amber-200/50 bg-linear-to-br from-amber-50 via-orange-50/30 to-yellow-50/50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 dark:border-amber-800/30 p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-amber-900 dark:text-amber-100">
              Conversion Result
            </h3>
            <p className="text-2xl font-bold text-amber-950 dark:text-amber-50">
              {currencyMode === 'USD'
                ? formatWbtc(convertedAmount)
                : formatUsd(convertedAmount)}
            </p>
            <p className="text-sm text-amber-800/70 dark:text-amber-200/70 mt-1">
              Equivalent to{' '}
              {currencyMode === 'USD'
                ? formatUsd(parseInputValue(inputValue))
                : formatWbtc(parseInputValue(inputValue))}
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

        {/* Wallet/Network warnings */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>
              Please connect your wallet to enable conversion features.
            </AlertDescription>
          </Alert>
        )}

        {isWrongNetwork && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>
              {chainId === undefined
                ? 'Unsupported network detected. Please switch to Ethereum Mainnet to interact with wBTC.'
                : 'Please switch to Ethereum Mainnet to interact with wBTC.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Contract metadata display */}
        {isConnected && isMainnet && (wbtcSymbol || wbtcDecimals) && (
          <section className="text-xs text-muted-foreground space-y-1">
            <p>
              Token Symbol:{' '}
              {isLoadingSymbol ? (
                <Spinner className="inline size-3" aria-hidden="true" />
              ) : (
                <span className="font-mono font-medium">{wbtcSymbol || 'N/A'}</span>
              )}
            </p>
            <p>
              Decimals:{' '}
              {isLoadingDecimals ? (
                <Spinner className="inline size-3" aria-hidden="true" />
              ) : (
                <span className="font-mono font-medium">{wbtcDecimals?.toString() || 'N/A'}</span>
              )}
            </p>
          </section>
        )}
      </CardContent>
    </Card>
  )
}

