import { describe, it, expect } from 'vitest'

/**
 * Test MSW handler for CoinGecko API
 * Verifies that price mocking works correctly
 */
describe('CoinGecko API Handler', () => {
  it('should mock Bitcoin price', async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    )

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toHaveProperty('bitcoin')
    expect(data.bitcoin).toHaveProperty('usd')
    expect(typeof data.bitcoin.usd).toBe('number')
  })

  it('should mock multiple asset prices', async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,usd-coin,dai&vs_currencies=usd'
    )

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toHaveProperty('bitcoin')
    expect(data).toHaveProperty('usd-coin')
    expect(data).toHaveProperty('dai')
  })

  it('should return default price for unknown assets', async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=unknown-asset&vs_currencies=usd'
    )

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toHaveProperty('unknown-asset')
    expect(data['unknown-asset']).toHaveProperty('usd')
  })
})

