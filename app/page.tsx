
'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useConnections } from 'wagmi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { WalletInfoBar } from './_components/walletInfoBar'
import { ConversionCard } from './_components/conversionCard'
import { ConversionResult } from './_components/conversionResult'
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { chains } from '@/lib/wagmi.config'
import type { AssetChainCombination } from '@/lib/assets-config'
import { getAllAssetChainCombinations } from '@/lib/assets-config'
import { mainnet } from 'wagmi/chains'

type CurrencyMode = 'USD' | 'WBTC'

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
  const conversionResultRef = useRef<HTMLElement>(null)
  const conversionSectionRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const cardContentRef = useRef<HTMLDivElement | null>(null)

  // Scroll to ensure both input and conversion result are visible on small screens
  const scrollToShowInputAndResult = useCallback(() => {
    // Only scroll on small screens (sm and below, which is < 640px)
    if (window.innerWidth >= 640) return

    const inputEl = inputRef.current
    const cardContentEl = cardContentRef.current
    const resultEl = conversionResultRef.current

    if (!inputEl || !cardContentEl) return

    setTimeout(() => {
      const fixedHeaderHeight = isConnected ? 112 : 128
      const viewportHeight = window.innerHeight
      // Estimate keyboard height (typically 300-400px on mobile)
      const estimatedKeyboardHeight = 350
      const availableHeight = viewportHeight - estimatedKeyboardHeight

      const cardContentRect = cardContentEl.getBoundingClientRect()
      
      // If result exists, check its position
      let resultRect: DOMRect | null = null
      if (resultEl) {
        resultRect = resultEl.getBoundingClientRect()
      }

      // Calculate the total height needed (input area + result if exists)
      const inputAreaHeight = cardContentRect.height
      const resultHeight = resultRect ? resultRect.height : 0
      const totalNeededHeight = inputAreaHeight + resultHeight + 32 // 32px spacing

      // If result exists and is not visible, scroll to show both
      if (resultRect && resultRect.bottom > availableHeight) {
        // Calculate scroll position to show result at bottom of available space
        const currentScrollY = window.scrollY
        const resultTop = resultRect.top + currentScrollY
        const targetScrollY = resultTop - (availableHeight - resultHeight - 16) // 16px padding
        
        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth',
        })
      } else if (totalNeededHeight <= availableHeight) {
        // Both fit, position input area optimally
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
      } else {
        // Content is taller than available space, prioritize showing input
        const cardContentTop = cardContentRect.top + window.scrollY
        const targetScrollY = cardContentTop - fixedHeaderHeight - 8
        
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
    scrollToShowInputAndResult()
  }, [scrollToShowInputAndResult])

  // Watch for conversion result appearance and ensure it's visible
  useEffect(() => {
    // Only on small screens
    if (window.innerWidth >= 640) return

    // When conversion result appears (convertedAmount changes from null to a value)
    if (conversionData.convertedAmount !== null && !conversionData.error) {
      scrollToShowInputAndResult()
    }
  }, [conversionData.convertedAmount, conversionData.error, scrollToShowInputAndResult])

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
              
              {/* Conversion result */}
              <ConversionResult
                ref={conversionResultRef}
                convertedAmount={conversionData.convertedAmount}
                currencyMode={conversionData.currencyMode}
                inputValue={conversionData.inputValue}
                error={conversionData.error}
              />
            </section>
          </section>
        </section>
      </section>
    </main>
  )
}
