/**
 * Storage utility for persisting user preferences
 * Uses localStorage for client-side persistence
 */

const STORAGE_KEYS = {
  CONNECTOR: 'wagmi_connector_preference',
  CHAIN: 'wagmi_chain_preference',
  ASSET_CHAIN: 'wagmi_asset_chain_preference',
} as const

/**
 * Save connector preference to localStorage
 * @param connectorId - The connector ID to save (e.g., 'metaMask', 'walletConnect')
 */
export function saveConnectorPreference(connectorId: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.CONNECTOR, connectorId)
  } catch (error) {
    console.warn('Failed to save connector preference:', error)
  }
}

/**
 * Load connector preference from localStorage
 * @returns The saved connector ID or null if not found
 */
export function loadConnectorPreference(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(STORAGE_KEYS.CONNECTOR)
  } catch (error) {
    console.warn('Failed to load connector preference:', error)
    return null
  }
}

/**
 * Save chain preference to localStorage
 * @param chainId - The chain ID to save (e.g., 1 for Ethereum Mainnet)
 */
export function saveChainPreference(chainId: number): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.CHAIN, chainId.toString())
  } catch (error) {
    console.warn('Failed to save chain preference:', error)
  }
}

/**
 * Load chain preference from localStorage
 * @returns The saved chain ID or null if not found
 */
export function loadChainPreference(): number | null {
  if (typeof window === 'undefined') return null

  try {
    const chainIdStr = localStorage.getItem(STORAGE_KEYS.CHAIN)
    if (!chainIdStr) return null

    const chainId = parseInt(chainIdStr, 10)
    if (isNaN(chainId)) return null

    return chainId
  } catch (error) {
    console.warn('Failed to load chain preference:', error)
    return null
  }
}

/**
 * Save asset-chain preference to localStorage
 * @param assetChainKey - The composite key to save (e.g., "wbtc-1")
 */
export function saveAssetChainPreference(assetChainKey: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.ASSET_CHAIN, assetChainKey)
  } catch (error) {
    console.warn('Failed to save asset-chain preference:', error)
  }
}

/**
 * Load asset-chain preference from localStorage
 * @returns The saved asset-chain key or null if not found
 */
export function loadAssetChainPreference(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(STORAGE_KEYS.ASSET_CHAIN)
  } catch (error) {
    console.warn('Failed to load asset-chain preference:', error)
    return null
  }
}

/**
 * Clear all stored preferences
 */
export function clearPreferences(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEYS.CONNECTOR)
    localStorage.removeItem(STORAGE_KEYS.CHAIN)
    localStorage.removeItem(STORAGE_KEYS.ASSET_CHAIN)
  } catch (error) {
    console.warn('Failed to clear preferences:', error)
  }
}

