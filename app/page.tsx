
'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { useConnections } from 'wagmi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { WalletInfoBar } from './_components/walletInfoBar'
import { ConversionCard } from './_components/conversionCard'
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { chains } from '@/lib/wagmi.config'
import type { AssetChainCombination } from '@/lib/assets-config'
import { getAllAssetChainCombinations } from '@/lib/assets-config'
import { mainnet } from 'wagmi/chains'

type CurrencyMode = 'USD' | 'TOKEN'

interface ConversionData {
  convertedAmount: number | null
  currencyMode: CurrencyMode
  inputValue: string
  error: string | null
}

/**
 * Home Page
 * Main page for USD <-> wBTC conversion application
 * Features:
 * - Fixed header with wallet/network info
 * - Conversion card with real-time price data
 * - Conversion result displayed below card
 */
export default function Home() {
  const connections = useConnections()
  const isConnected = connections.length > 0
  const { chainId, isSupportedChain } = useWalletStatus()

  // Selected asset-chain combination state (lifted to page level for sharing)
  // Default to wBTC on Ethereum Mainnet
  const defaultAssetChain = useMemo(() => {
    const combinations = getAllAssetChainCombinations()
    return combinations.find((c) => c.assetId === 'wbtc' && c.chainId === mainnet.id) ?? null
  }, [])

  const [selectedAssetChain, setSelectedAssetChain] = useState<AssetChainCombination | null>(defaultAssetChain)

  // Get network name for unsupported chains
  const unsupportedNetworkName = useMemo(() => {
    if (!chainId || isSupportedChain) return null
    const detectedChain = chains.find((chain) => chain.id === chainId)
    return detectedChain?.name ?? 'This network'
  }, [chainId, isSupportedChain])

  // Check if selected asset-chain matches connected chain
  const assetChainMismatch = useMemo(() => {
    if (!isConnected || !selectedAssetChain || !chainId) return null
    
    // Check if connected chain matches selected asset-chain
    if (chainId !== selectedAssetChain.chainId) {
      const connectedChain = chains.find((chain) => chain.id === chainId)
      return {
        selectedAsset: selectedAssetChain.asset.symbol,
        selectedChain: selectedAssetChain.chain.name,
        connectedChain: connectedChain?.name ?? 'Unknown Network',
      }
    }
    return null
  }, [isConnected, selectedAssetChain, chainId])
  const [conversionData, setConversionData] = useState<ConversionData>({
    convertedAmount: null,
    currencyMode: 'USD',
    inputValue: '',
    error: null,
  })
  const conversionSectionRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const cardContentRef = useRef<HTMLDivElement | null>(null)

  // Scroll to ensure input is visible on small screens
  const scrollToShowInput = useCallback(() => {
    // Only scroll on small screens (sm and below, which is < 640px)
    if (window.innerWidth >= 640) return

    const inputEl = inputRef.current
    const cardContentEl = cardContentRef.current

    if (!inputEl || !cardContentEl) return

    setTimeout(() => {
      const fixedHeaderHeight = isConnected ? 112 : 128
      const cardContentRect = cardContentEl.getBoundingClientRect()
      const cardContentTop = cardContentRect.top + window.scrollY
      const targetScrollY = cardContentTop - fixedHeaderHeight - 8
      
      const currentCardContentTop = cardContentRect.top
      const optimalTop = fixedHeaderHeight + 8
      if (Math.abs(currentCardContentTop - optimalTop) > 20) {
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth',
        })
      }
    }, 200)
  }, [isConnected])

  // Scroll to position input field optimally on small screens when focused
  const handleInputFocus = useCallback((inputElement: HTMLInputElement | null, cardContentElement: HTMLDivElement | null) => {
    // Store refs for later use
    inputRef.current = inputElement
    cardContentRef.current = cardContentElement
    
    // Trigger scroll calculation
    scrollToShowInput()
  }, [scrollToShowInput])

  return (
    <main>
      <WalletInfoBar selectedAssetChain={selectedAssetChain} onAssetChainChange={setSelectedAssetChain} />
      <section className={`min-h-screen ${isConnected ? 'pt-28' : 'pt-32 md:pt-24'}`}>
        <section className="container mx-auto px-4 py-8">
          <section className="max-w-4xl mx-auto space-y-8">
            {/* Unsupported network alert */}
            {isConnected && !isSupportedChain && unsupportedNetworkName && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>
                  {`${unsupportedNetworkName} is not supported. Please switch to a supported network (Ethereum Mainnet, Sepolia, Polygon, or Arbitrum) to interact with assets.`}
                </AlertDescription>
              </Alert>
            )}

            {/* Asset-chain mismatch alert */}
            {isConnected && assetChainMismatch && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>
                  {`You selected ${assetChainMismatch.selectedAsset} on ${assetChainMismatch.selectedChain}, but your wallet is connected to ${assetChainMismatch.connectedChain}. Please switch your wallet to ${assetChainMismatch.selectedChain} or select a different asset-chain combination.`}
                </AlertDescription>
              </Alert>
            )}

            {/* Page header */}
            <header className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Multi-Asset Converter & Bridge</h1>
              <p className="text-lg text-muted-foreground">
                Convert between USD and multiple ERC-20 tokens across EVM chains. Bridge assets seamlessly.
              </p>
            </header>

            {/* Conversion card */}
            <section className="space-y-4" aria-label="Currency conversion interface" ref={conversionSectionRef}>
              <ConversionCard 
                selectedAssetChain={selectedAssetChain}
                onConversionChange={setConversionData} 
                onInputFocus={handleInputFocus} 
              />
            </section>
          </section>
        </section>
      </section>
    </main>
  )
}
