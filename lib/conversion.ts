/**
 * Conversion utilities for USD <-> Multi-Asset conversion
 */

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price'

export interface TokenPrice {
  [key: string]: {
    usd: number
  }
}

/**
 * Fetch current token price from CoinGecko API by CoinGecko ID
 * @param coingeckoId - The CoinGecko ID for the token (e.g., 'wrapped-bitcoin', 'usd-coin', 'dai')
 * @returns The USD price of the token
 */
export async function fetchTokenPrice(coingeckoId: string): Promise<number> {
  try {
    const url = `${COINGECKO_API_BASE_URL}?ids=${coingeckoId}&vs_currencies=usd`
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch token price: ${response.statusText}`)
    }

    const data: TokenPrice = await response.json()
    const price = data[coingeckoId]?.usd
    
    if (!price || price <= 0) {
      throw new Error(`Invalid price data for ${coingeckoId}`)
    }

    return price
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to fetch token price: ${error.message}`
        : 'Failed to fetch token price: Unknown error'
    )
  }
}

/**
 * Fetch current Bitcoin price from CoinGecko API (backward compatibility)
 * @deprecated Use fetchTokenPrice('wrapped-bitcoin') instead
 */
export async function fetchBitcoinPrice(): Promise<number> {
  return fetchTokenPrice('wrapped-bitcoin')
}

/**
 * Convert USD to token amount
 * @param usdAmount - Amount in USD
 * @param tokenPrice - Price of token in USD
 * @returns Amount of tokens
 */
export function usdToToken(usdAmount: number, tokenPrice: number): number {
  if (tokenPrice <= 0) return 0
  return usdAmount / tokenPrice
}

/**
 * Convert token amount to USD
 * @param tokenAmount - Amount of tokens
 * @param tokenPrice - Price of token in USD
 * @returns Amount in USD
 */
export function tokenToUsd(tokenAmount: number, tokenPrice: number): number {
  return tokenAmount * tokenPrice
}

/**
 * Convert USD to wBTC (backward compatibility)
 * @deprecated Use usdToToken instead
 */
export function usdToWbtc(usdAmount: number, btcPrice: number): number {
  return usdToToken(usdAmount, btcPrice)
}

/**
 * Convert wBTC to USD (backward compatibility)
 * @deprecated Use tokenToUsd instead
 */
export function wbtcToUsd(wbtcAmount: number, btcPrice: number): number {
  return tokenToUsd(wbtcAmount, btcPrice)
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
 * Format token amount with specified decimals
 * @param amount - Amount to format
 * @param symbol - Token symbol (e.g., 'wBTC', 'USDC', 'DAI')
 * @param decimals - Number of decimal places (default: 8)
 * @returns Formatted string with symbol
 */
export function formatToken(amount: number, symbol: string, decimals: number = 8): string {
  // Remove trailing zeros but keep at least 2 decimal places if there's a fractional part
  const formatted = amount.toFixed(decimals)
  const trimmed = formatted.replace(/\.?0+$/, '')
  return `${trimmed} ${symbol}`
}

/**
 * Format wBTC amount with up to 8 decimal places (backward compatibility)
 * @deprecated Use formatToken instead
 */
export function formatWbtc(amount: number): string {
  return formatToken(amount, 'wBTC', 8)
}

/**
 * Validate token input with specified decimal places
 * @param value - Input value to validate
 * @param maxDecimals - Maximum number of decimal places allowed (default: 8)
 * @returns True if input is valid
 */
export function validateTokenInput(value: string, maxDecimals: number = 8): boolean {
  if (value === '' || value === '.') return true // Allow empty or just decimal point
  const regex = new RegExp(`^\\d+(\\.\\d{0,${maxDecimals}})?$`)
  return regex.test(value)
}

/**
 * Validate USD input (max 2 decimal places)
 */
export function validateUsdInput(value: string): boolean {
  return validateTokenInput(value, 2)
}

/**
 * Validate wBTC input (max 8 decimal places)
 * @deprecated Use validateTokenInput(value, 8) instead
 */
export function validateWbtcInput(value: string): boolean {
  return validateTokenInput(value, 8)
}

/**
 * Parse numeric value from input string
 */
export function parseInputValue(value: string): number {
  if (value === '' || value === '.') return 0
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Normalize numeric input by removing leading zeros and extra decimal points
 * Examples:
 * - '01' → '1'
 * - '001' → '1'
 * - '01020' → '1020'
 * - '01..' → '1.'
 * - '00.5' → '0.5'
 * - '.5' → '0.5'
 * - '0.5' → '0.5' (unchanged)
 * @param value - Input value to normalize
 * @returns Normalized string value
 */
export function normalizeNumericInput(value: string): string {
  if (value === '' || value === '.') return value
  
  // Remove all non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '')
  
  // Handle multiple decimal points - keep only the first one
  const firstDotIndex = cleaned.indexOf('.')
  if (firstDotIndex !== -1) {
    const beforeDot = cleaned.substring(0, firstDotIndex)
    const afterDot = cleaned.substring(firstDotIndex + 1).replace(/\./g, '')
    cleaned = beforeDot + '.' + afterDot
  }
  
  // Handle leading zeros
  // Split by decimal point to handle integer and decimal parts separately
  const parts = cleaned.split('.')
  const integerPart = parts[0] || ''
  const decimalPart = parts[1] || ''
  
  // Remove leading zeros from integer part, but keep at least one zero if it's just '0' or '00'
  let normalizedInteger = integerPart.replace(/^0+/, '') || '0'
  
  // Special case: if user is typing '0.' or '00.', preserve the zero
  if (integerPart === '' && decimalPart !== '') {
    normalizedInteger = '0'
  }
  
  // Reconstruct the normalized value
  if (decimalPart !== '') {
    return normalizedInteger + '.' + decimalPart
  }
  
  // If no decimal part, return normalized integer (but preserve '0' if that's what user typed)
  if (normalizedInteger === '0' && integerPart === '') {
    return '0'
  }
  
  return normalizedInteger
}

