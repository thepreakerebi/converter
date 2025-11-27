'use client'

import { useQuery } from '@tanstack/react-query'

export interface TokenPrice {
  [key: string]: {
    usd: number
  }
}

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price'

/**
 * useTokenPrices Hook
 * Fetches and caches token prices using TanStack Query
 * Supports multiple assets via CoinGecko multi-id endpoint
 * 
 * Caching Strategy:
 * - staleTime: 60 * 1000 (1 minute) - Prices considered fresh for 1 minute
 * - cacheTime: 5 * 60 * 1000 (5 minutes) - Keep in cache for 5 minutes
 * - refetchOnWindowFocus: false - Avoid unnecessary requests on window focus
 * - Background refetch: enabled - Updates prices in background when stale
 * 
 * @param assetIds - Array of CoinGecko IDs (e.g., ['wrapped-bitcoin', 'usd-coin', 'dai'])
 * @returns Object containing prices map, loading state, error, and refetch function
 */
export interface UseTokenPricesReturn {
  prices: Record<string, number>
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useTokenPrices(assetIds: string[]): UseTokenPricesReturn {
  // Create comma-separated string of IDs for CoinGecko API
  const idsParam = assetIds.join(',')

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<TokenPrice>({
    queryKey: ['tokenPrices', idsParam],
    queryFn: async () => {
      if (assetIds.length === 0) {
        return {}
      }

      const url = `${COINGECKO_API_BASE_URL}?ids=${idsParam}&vs_currencies=usd`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch token prices: ${response.statusText}`)
      }

      const data: TokenPrice = await response.json()
      return data
    },
    staleTime: 60 * 1000, // 1 minute - prices considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Refetch on mount if stale
    enabled: assetIds.length > 0, // Only fetch if we have asset IDs
  })

  // Transform data into price map by CoinGecko ID
  const prices: Record<string, number> = {}
  if (data) {
    for (const [coingeckoId, priceData] of Object.entries(data)) {
      if (priceData?.usd && priceData.usd > 0) {
        prices[coingeckoId] = priceData.usd
      }
    }
  }

  return {
    prices,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}

