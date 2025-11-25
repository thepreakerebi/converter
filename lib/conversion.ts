/**
 * Conversion utilities for USD <-> wBTC conversion
 */

const COINGECKO_API_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'

export interface BitcoinPrice {
  bitcoin: {
    usd: number
  }
}

/**
 * Fetch current Bitcoin price from CoinGecko API
 */
export async function fetchBitcoinPrice(): Promise<number> {
  try {
    const response = await fetch(COINGECKO_API_URL, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin price: ${response.statusText}`)
    }

    const data: BitcoinPrice = await response.json()
    return data.bitcoin.usd
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to fetch Bitcoin price: ${error.message}`
        : 'Failed to fetch Bitcoin price: Unknown error'
    )
  }
}

/**
 * Convert USD to wBTC
 */
export function usdToWbtc(usdAmount: number, btcPrice: number): number {
  if (btcPrice <= 0) return 0
  return usdAmount / btcPrice
}

/**
 * Convert wBTC to USD
 */
export function wbtcToUsd(wbtcAmount: number, btcPrice: number): number {
  return wbtcAmount * btcPrice
}

/**
 * Format USD amount with 2 decimal places
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format wBTC amount with up to 8 decimal places
 */
export function formatWbtc(amount: number): string {
  // Remove trailing zeros but keep at least 2 decimal places if there's a fractional part
  const formatted = amount.toFixed(8)
  const trimmed = formatted.replace(/\.?0+$/, '')
  return `${trimmed} wBTC`
}

/**
 * Validate USD input (max 2 decimal places)
 */
export function validateUsdInput(value: string): boolean {
  if (value === '' || value === '.') return true // Allow empty or just decimal point
  const regex = /^\d+(\.\d{0,2})?$/
  return regex.test(value)
}

/**
 * Validate wBTC input (max 8 decimal places)
 */
export function validateWbtcInput(value: string): boolean {
  if (value === '' || value === '.') return true // Allow empty or just decimal point
  const regex = /^\d+(\.\d{0,8})?$/
  return regex.test(value)
}

/**
 * Parse numeric value from input string
 */
export function parseInputValue(value: string): number {
  if (value === '' || value === '.') return 0
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

