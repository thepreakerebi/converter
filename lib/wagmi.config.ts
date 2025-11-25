import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { cookieStorage, createStorage } from 'wagmi'
import { injected, metaMask, walletConnect } from '@wagmi/connectors'

/**
 * Wagmi Configuration for Ethereum Mainnet
 * Configured for wBTC token interactions on Ethereum Mainnet
 */

// wBTC contract address on Ethereum Mainnet
export const WBTC_CONTRACT_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as const

// Ethereum Mainnet chain configuration
export const chains = [mainnet] as const

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
  },
})

