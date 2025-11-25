import { WBTC_CONTRACT_ADDRESS } from './wagmi.config'
import { erc20Abi } from 'viem'

/**
 * wBTC ERC-20 Contract Configuration
 * Standard ERC-20 ABI for reading token metadata
 */
export const wbtcContractConfig = {
  address: WBTC_CONTRACT_ADDRESS as `0x${string}`,
  abi: erc20Abi,
} as const

/**
 * Contract function names for type safety
 */
export const WBTC_FUNCTIONS = {
  symbol: 'symbol',
  decimals: 'decimals',
  balanceOf: 'balanceOf',
} as const

