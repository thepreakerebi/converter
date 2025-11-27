import type { Chain } from 'viem/chains'
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains'

/**
 * Asset metadata interface
 * Defines the structure for ERC-20 token metadata across different chains
 */
export interface AssetMetadata {
  id: string
  symbol: string
  name: string
  decimals: number // Default decimals (can be overridden per chain)
  icon?: string // URL or emoji for asset icon
  coingeckoId: string // CoinGecko API ID for price fetching
  chains: {
    [chainId: number]: {
      address: string // Contract address on this chain
      decimals: number // Decimals for this specific chain (may differ)
    }
  }
}

/**
 * Assets configuration
 * Centralized metadata for all supported ERC-20 tokens across EVM chains
 */
export const ASSETS: Record<string, AssetMetadata> = {
  wbtc: {
    id: 'wbtc',
    symbol: 'wBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    icon: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857',
    coingeckoId: 'wrapped-bitcoin',
    chains: {
      [mainnet.id]: {
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        decimals: 8,
      },
      [sepolia.id]: {
        address: '0x29f2D40B0605204364af54EC677bD022dA425d03', // Mock Sepolia address
        decimals: 8,
      },
    },
  },
  usdc: {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/6319/standard/USD_Coin_icon.png?1696507857',
    coingeckoId: 'usd-coin',
    chains: {
      [mainnet.id]: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
      },
      [polygon.id]: {
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        decimals: 6,
      },
    },
  },
  dai: {
    id: 'dai',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    icon: 'https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png?1696507857',
    coingeckoId: 'dai',
    chains: {
      [mainnet.id]: {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
      },
      [arbitrum.id]: {
        address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
        decimals: 18,
      },
    },
  },
} as const

/**
 * Get asset by ID
 */
export function getAssetById(assetId: string): AssetMetadata | undefined {
  return ASSETS[assetId.toLowerCase()]
}

/**
 * Get all assets available on a specific chain
 */
export function getAssetsByChain(chainId: number): AssetMetadata[] {
  return Object.values(ASSETS).filter((asset) => chainId in asset.chains)
}

/**
 * Get chain object by ID (from wagmi chains)
 */
function getChainById(chainId: number): Chain | null {
  // Import chains dynamically to avoid circular dependencies
  const chains: Record<number, Chain> = {
    [mainnet.id]: mainnet,
    [sepolia.id]: sepolia,
    [polygon.id]: polygon,
    [arbitrum.id]: arbitrum,
  }
  return chains[chainId] ?? null
}

/**
 * Asset-chain combination type
 */
export interface AssetChainCombination {
  assetId: string
  chainId: number
  asset: AssetMetadata
  chain: Chain
}

/**
 * Get all valid asset-chain combinations
 * Returns all possible combinations of assets and chains where the asset is available
 */
export function getAllAssetChainCombinations(): AssetChainCombination[] {
  const combinations: AssetChainCombination[] = []

  for (const asset of Object.values(ASSETS)) {
    for (const chainId of Object.keys(asset.chains).map(Number)) {
      const chain = getChainById(chainId)
      if (chain) {
        combinations.push({
          assetId: asset.id,
          chainId,
          asset,
          chain,
        })
      }
    }
  }

  return combinations
}

/**
 * Create composite key for asset-chain combination
 * Format: "assetId-chainId" (e.g., "wbtc-1", "usdc-137")
 */
export function createAssetChainKey(assetId: string, chainId: number): string {
  return `${assetId.toLowerCase()}-${chainId}`
}

/**
 * Parse composite key to extract asset ID and chain ID
 * Returns null if key format is invalid
 */
export function parseAssetChainKey(key: string): { assetId: string; chainId: number } | null {
  const parts = key.split('-')
  if (parts.length < 2) return null

  // Last part is chainId, everything before is assetId (handles cases like "usd-coin-1")
  const chainId = Number(parts[parts.length - 1])
  const assetId = parts.slice(0, -1).join('-')

  if (isNaN(chainId) || !assetId) return null

  return { assetId, chainId }
}

