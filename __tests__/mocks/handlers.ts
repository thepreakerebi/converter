import { http, HttpResponse } from 'msw'

/**
 * MSW Handlers for API mocking in tests
 * Handles both bridge API and CoinGecko API endpoints
 */

// Mock bridge API handler
export const bridgeHandler = http.post('/api/bridge', async () => {
  // Simulate latency (1-3 seconds)
  const delay = Math.floor(Math.random() * 2000) + 1000
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Randomly return success (70%) or failure (30%)
  const isSuccess = Math.random() > 0.3

  if (isSuccess) {
    return HttpResponse.json(
      {
        success: true,
        transactionId: `0x${Math.random().toString(16).substring(2, 66)}`,
      },
      { status: 200 }
    )
  }

  return HttpResponse.json(
    {
      success: false,
      error: 'Transaction failed: Insufficient liquidity',
    },
    { status: 400 }
  )
})

// Mock CoinGecko API handler
export const coingeckoHandler = http.get(
  'https://api.coingecko.com/api/v3/simple/price',
  ({ request }) => {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    const vsCurrencies = url.searchParams.get('vs_currencies') || 'usd'

    // Parse asset IDs
    const assetIds = ids?.split(',') || []

    // Mock price data
    const mockPrices: Record<string, Record<string, number>> = {
      bitcoin: { usd: 87682.5 },
      'usd-coin': { usd: 1.0 },
      dai: { usd: 1.0 },
      ethereum: { usd: 3245.67 },
      'wrapped-bitcoin': { usd: 87682.5 },
    }

    // Build response based on requested IDs
    const response: Record<string, Record<string, number>> = {}
    assetIds.forEach((id) => {
      const trimmedId = id.trim()
      if (mockPrices[trimmedId]) {
        response[trimmedId] = mockPrices[trimmedId]
      } else {
        // Default price for unknown assets
        response[trimmedId] = { usd: 100.0 }
      }
    })

    return HttpResponse.json(response, { status: 200 })
  }
)

// Export all handlers
export const handlers = [bridgeHandler, coingeckoHandler]

