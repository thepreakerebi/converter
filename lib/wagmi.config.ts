import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { cookieStorage, createStorage } from 'wagmi'
import { injected, metaMask, walletConnect } from '@wagmi/connectors'

/**
 * Wagmi Configuration for Ethereum Mainnet and Sepolia Testnet
 * Configured for wBTC token interactions on Ethereum Mainnet
 * Supports multi-chain wallet connections
 */

// wBTC contract address on Ethereum Mainnet
export const WBTC_CONTRACT_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as const

// Supported chains: Ethereum Mainnet and Sepolia Testnet
export const chains = [mainnet, sepolia] as const

// Export supported chains for use in components
export const supportedChains = chains

// WalletConnect project ID (optional - can be set via env var)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Create wagmi config with cookie storage for SSR support
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

