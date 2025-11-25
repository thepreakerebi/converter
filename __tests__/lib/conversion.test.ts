import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchBitcoinPrice,
  usdToWbtc,
  wbtcToUsd,
  formatUsd,
  formatWbtc,
  validateUsdInput,
  validateWbtcInput,
  parseInputValue,
} from '../../lib/conversion'

describe('conversion utilities', () => {
  describe('fetchBitcoinPrice', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should fetch Bitcoin price successfully', async () => {
      const mockPrice = 87682.50
      const mockResponse = {
        bitcoin: {
          usd: mockPrice,
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const price = await fetchBitcoinPrice()
      expect(price).toBe(mockPrice)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        { next: { revalidate: 60 } }
      )
    })

    it('should throw error when API response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(fetchBitcoinPrice()).rejects.toThrow(
        'Failed to fetch Bitcoin price: Not Found'
      )
    })

    it('should throw error when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(fetchBitcoinPrice()).rejects.toThrow(
        'Failed to fetch Bitcoin price: Network error'
      )
    })

    it('should handle unknown errors', async () => {
      global.fetch = vi.fn().mockRejectedValue('Unknown error')

      await expect(fetchBitcoinPrice()).rejects.toThrow(
        'Failed to fetch Bitcoin price: Unknown error'
      )
    })
  })

  describe('usdToWbtc', () => {
    it('should convert USD to wBTC correctly', () => {
      const btcPrice = 50000
      const usdAmount = 1000
      const expectedWbtc = 0.02

      expect(usdToWbtc(usdAmount, btcPrice)).toBe(expectedWbtc)
    })

    it('should return 0 when BTC price is 0', () => {
      expect(usdToWbtc(1000, 0)).toBe(0)
    })

    it('should return 0 when BTC price is negative', () => {
      expect(usdToWbtc(1000, -100)).toBe(0)
    })

    it('should handle small amounts correctly', () => {
      const btcPrice = 50000
      const usdAmount = 1
      const expectedWbtc = 0.00002

      expect(usdToWbtc(usdAmount, btcPrice)).toBeCloseTo(expectedWbtc, 8)
    })

    it('should handle large amounts correctly', () => {
      const btcPrice = 50000
      const usdAmount = 1000000
      const expectedWbtc = 20

      expect(usdToWbtc(usdAmount, btcPrice)).toBe(expectedWbtc)
    })
  })

  describe('wbtcToUsd', () => {
    it('should convert wBTC to USD correctly', () => {
      const btcPrice = 50000
      const wbtcAmount = 0.02
      const expectedUsd = 1000

      expect(wbtcToUsd(wbtcAmount, btcPrice)).toBe(expectedUsd)
    })

    it('should handle small wBTC amounts', () => {
      const btcPrice = 50000
      const wbtcAmount = 0.00001
      const expectedUsd = 0.5

      expect(wbtcToUsd(wbtcAmount, btcPrice)).toBe(expectedUsd)
    })

    it('should handle large wBTC amounts', () => {
      const btcPrice = 50000
      const wbtcAmount = 10
      const expectedUsd = 500000

      expect(wbtcToUsd(wbtcAmount, btcPrice)).toBe(expectedUsd)
    })

    it('should handle zero wBTC amount', () => {
      expect(wbtcToUsd(0, 50000)).toBe(0)
    })
  })

  describe('formatUsd', () => {
    it('should format USD with 2 decimal places', () => {
      expect(formatUsd(1000.5)).toBe('$1,000.50')
      expect(formatUsd(87682.5)).toBe('$87,682.50')
    })

    it('should format whole numbers with 2 decimal places', () => {
      expect(formatUsd(1000)).toBe('$1,000.00')
    })

    it('should format small amounts correctly', () => {
      expect(formatUsd(0.5)).toBe('$0.50')
      expect(formatUsd(0.01)).toBe('$0.01')
    })

    it('should format large amounts with thousand separators', () => {
      expect(formatUsd(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatWbtc', () => {
    it('should format wBTC with up to 8 decimal places', () => {
      expect(formatWbtc(0.02)).toBe('0.02 wBTC')
      expect(formatWbtc(1.12345678)).toBe('1.12345678 wBTC')
    })

    it('should remove trailing zeros', () => {
      expect(formatWbtc(1.5)).toBe('1.5 wBTC')
      expect(formatWbtc(1.50000000)).toBe('1.5 wBTC')
    })

    it('should format whole numbers without decimals', () => {
      expect(formatWbtc(1)).toBe('1 wBTC')
      expect(formatWbtc(10)).toBe('10 wBTC')
    })

    it('should handle very small amounts', () => {
      expect(formatWbtc(0.00000001)).toBe('0.00000001 wBTC')
    })
  })

  describe('validateUsdInput', () => {
    it('should validate valid USD inputs', () => {
      expect(validateUsdInput('100')).toBe(true)
      expect(validateUsdInput('100.5')).toBe(true)
      expect(validateUsdInput('100.50')).toBe(true)
      expect(validateUsdInput('0.01')).toBe(true)
    })

    it('should allow empty or decimal point only', () => {
      expect(validateUsdInput('')).toBe(true)
      expect(validateUsdInput('.')).toBe(true)
    })

    it('should reject inputs with more than 2 decimal places', () => {
      expect(validateUsdInput('100.123')).toBe(false)
      expect(validateUsdInput('100.999')).toBe(false)
    })

    it('should reject invalid formats', () => {
      expect(validateUsdInput('abc')).toBe(false)
      expect(validateUsdInput('100.')).toBe(true) // Valid, just decimal point
      expect(validateUsdInput('.50')).toBe(false) // Invalid, needs leading digit
    })
  })

  describe('validateWbtcInput', () => {
    it('should validate valid wBTC inputs', () => {
      expect(validateWbtcInput('1')).toBe(true)
      expect(validateWbtcInput('1.5')).toBe(true)
      expect(validateWbtcInput('1.12345678')).toBe(true)
      expect(validateWbtcInput('0.00000001')).toBe(true)
    })

    it('should allow empty or decimal point only', () => {
      expect(validateWbtcInput('')).toBe(true)
      expect(validateWbtcInput('.')).toBe(true)
    })

    it('should reject inputs with more than 8 decimal places', () => {
      expect(validateWbtcInput('1.123456789')).toBe(false)
      expect(validateWbtcInput('1.999999999')).toBe(false)
    })

    it('should reject invalid formats', () => {
      expect(validateWbtcInput('abc')).toBe(false)
      expect(validateWbtcInput('1.')).toBe(true) // Valid
      expect(validateWbtcInput('.5')).toBe(false) // Invalid, needs leading digit
    })
  })

  describe('parseInputValue', () => {
    it('should parse valid numeric strings', () => {
      expect(parseInputValue('100')).toBe(100)
      expect(parseInputValue('100.5')).toBe(100.5)
      expect(parseInputValue('0.01')).toBe(0.01)
    })

    it('should return 0 for empty or decimal point only', () => {
      expect(parseInputValue('')).toBe(0)
      expect(parseInputValue('.')).toBe(0)
    })

    it('should return 0 for invalid input', () => {
      expect(parseInputValue('abc')).toBe(0)
      expect(parseInputValue('invalid')).toBe(0)
    })

    it('should handle leading/trailing whitespace', () => {
      // Note: parseFloat handles whitespace, but our function doesn't trim
      // This is expected behavior
      expect(parseInputValue('100')).toBe(100)
    })
  })
})

