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
import { AlertCircle, ArrowLeftRight, Bitcoin } from 'lucide-react'
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
  const isMainnet = chainId === mainnet.id

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('USD')
  const [inputValue, setInputValue] = useState('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

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

  // Handle input change with validation
  const handleInputChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')

    // Validate based on currency mode
    const isValid =
      currencyMode === 'USD' ? validateUsdInput(cleaned) : validateWbtcInput(cleaned)

    if (isValid) {
      setInputValue(cleaned)
      setError(null)
    }
  }

  // Handle conversion
  const handleConvert = async () => {
    if (!inputValue || parseInputValue(inputValue) === 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!btcPrice) {
      setError('Bitcoin price not available. Please try again.')
      return
    }

    setIsConverting(true)
    setError(null)

    try {
      const amount = parseInputValue(inputValue)

      if (currencyMode === 'USD') {
        const wbtcAmount = usdToWbtc(amount, btcPrice)
        setConvertedAmount(wbtcAmount)
      } else {
        const usdAmount = wbtcToUsd(amount, btcPrice)
        setConvertedAmount(usdAmount)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Conversion failed. Please try again.'
      )
    } finally {
      setIsConverting(false)
    }
  }

  // Handle currency toggle
  const handleToggleCurrency = () => {
    setCurrencyMode(currencyMode === 'USD' ? 'WBTC' : 'USD')
    setInputValue('')
    setConvertedAmount(null)
    setError(null)
  }

  // Check if input is disabled
  const isInputDisabled = !isConnected || !isMainnet || isLoadingPrice

  // Get placeholder text
  const placeholderText =
    currencyMode === 'USD'
      ? 'Enter amount in USD (max 2 decimals)'
      : 'Enter amount in wBTC (max 8 decimals)'

  // Get decimal hint
  const decimalHint =
    currencyMode === 'USD'
      ? 'Maximum 2 decimal places'
      : 'Maximum 8 decimal places'

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="size-5" aria-hidden="true" />
          Currency Converter
        </CardTitle>
        <CardDescription>
          Convert between USD and Wrapped Bitcoin (wBTC) using real-time market prices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input section */}
        <section className="space-y-4">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <section className="flex-1 space-y-2">
              <Label htmlFor="amount-input">
                Amount ({currencyMode})
                <span className="ml-2 text-xs text-muted-foreground">({decimalHint})</span>
              </Label>
              <section className="relative">
                <Input
                  id="amount-input"
                  type="text"
                  inputMode="decimal"
                  placeholder={placeholderText}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  disabled={isInputDisabled}
                  aria-label={`Enter amount in ${currencyMode}`}
                  aria-describedby="decimal-hint"
                  className={currencyMode === 'WBTC' ? 'pr-12' : ''}
                />
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
              <p id="decimal-hint" className="text-xs text-muted-foreground">
                {decimalHint}
              </p>
            </section>

            {/* Toggle button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleToggleCurrency}
              aria-label={`Switch to ${currencyMode === 'USD' ? 'wBTC' : 'USD'} input mode`}
              className="shrink-0"
            >
              <ArrowLeftRight className="size-4" aria-hidden="true" />
            </Button>
          </section>

          {/* Convert button */}
          <Button
            type="button"
            onClick={handleConvert}
            disabled={isInputDisabled || !inputValue || isConverting}
            className="w-full"
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
          </Button>
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
          <section className="rounded-lg border bg-muted/50 p-4">
            <h3 className="text-sm font-medium mb-2">Conversion Result</h3>
            <p className="text-2xl font-bold">
              {currencyMode === 'USD'
                ? formatWbtc(convertedAmount)
                : formatUsd(convertedAmount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
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

        {isConnected && !isMainnet && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>
              Please switch to Ethereum Mainnet to interact with wBTC.
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

