import { createConfig, http } from 'wagmi'
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  fantom,
  gnosis,
  zkSync,
  scroll,
  linea,
  blast,
  mantle,
  celo,
  aurora,
  metis,
  moonbeam,
  moonriver,
  cronos,
  boba,
  zora,
  celoAlfajores,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonMumbai,
  polygonAmoy,
} from 'wagmi/chains'
import { cookieStorage, createStorage } from 'wagmi'
import { injected, metaMask, walletConnect } from '@wagmi/connectors'

/**
 * Wagmi Configuration for Multi-Asset Support
 * Configured for multiple ERC-20 tokens across EVM chains:
 * - wBTC: Ethereum Mainnet, Sepolia
 * - USDC: Ethereum Mainnet, Polygon
 * - DAI: Ethereum Mainnet, Arbitrum
 * 
 * Supported chains (in supportedChains): Mainnet, Sepolia, Polygon, Arbitrum
 * Additional chains are included in wagmi's chains array to enable
 * detection of unsupported networks, but are NOT included in supportedChains
 * array which determines app-level support. This allows the app to detect
 * and display proper error messages for any EVM-compatible chain.
 */

// wBTC contract address on Ethereum Mainnet
export const WBTC_CONTRACT_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as const

// Chains that wagmi should detect (includes common unsupported chains for detection purposes)
// Adding these chains allows wagmi to detect them and show proper error messages
// This covers most popular EVM chains users might connect to, including:
// - Major L2s: Arbitrum, Optimism, Base, zkSync, Scroll, Linea, Blast, Mantle, Metis, Boba
// - Popular chains: Polygon, BSC, Avalanche, Fantom, Gnosis, Celo, Aurora, Moonbeam, Moonriver, Cronos, Zora
// - Common testnets: Various Sepolia variants, Mumbai, Amoy, Alfajores
export const chains = [
  // Supported chains
  mainnet,
  sepolia,
  // Major L2s
  arbitrum,
  optimism,
  base,
  zkSync,
  scroll,
  linea,
  blast,
  mantle,
  metis,
  boba,
  // Popular chains
  polygon,
  bsc,
  avalanche,
  fantom,
  gnosis,
  celo,
  aurora,
  moonbeam,
  moonriver,
  cronos,
  zora,
  // Common testnets
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonMumbai,
  polygonAmoy,
  celoAlfajores,
] as const

// Supported chains for app-level functionality
// Includes chains where we have assets configured (wBTC, USDC, DAI)
// This is what useWalletStatus uses to determine isSupportedChain
export const supportedChains = [mainnet, sepolia, polygon, arbitrum] as const

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
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
    [gnosis.id]: http(),
    [zkSync.id]: http(),
    [scroll.id]: http(),
    [linea.id]: http(),
    [blast.id]: http(),
    [mantle.id]: http(),
    [celo.id]: http(),
    [aurora.id]: http(),
    [metis.id]: http(),
    [moonbeam.id]: http(),
    [moonriver.id]: http(),
    [cronos.id]: http(),
    [boba.id]: http(),
    [zora.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [polygonAmoy.id]: http(),
    [celoAlfajores.id]: http(),
  },
})

