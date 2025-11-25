'use client'

import { formatUsd, formatWbtc, parseInputValue } from '@/lib/conversion'

type CurrencyMode = 'USD' | 'WBTC'

interface ConversionResultProps {
  convertedAmount: number | null
  currencyMode: CurrencyMode
  inputValue: string
  error: string | null
}

/**
 * ConversionResult Component
 * Displays the conversion result with gradient background
 */
export function ConversionResult({
  convertedAmount,
  currencyMode,
  inputValue,
  error,
}: ConversionResultProps) {
  // Don't render if no conversion result or there's an error
  if (convertedAmount === null || error) {
    return null
  }

  return (
    <section className="rounded-lg border-2 border-amber-200/50 bg-linear-to-br from-amber-50 via-orange-50/30 to-yellow-50/50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 dark:border-amber-800/30 p-4 shadow-sm w-full max-w-xl mx-auto">
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
  )
}

