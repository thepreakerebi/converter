
'use client'

import { useState, useRef, useCallback } from 'react'
import { useConnections } from 'wagmi'
import { WalletInfoBar } from './_components/walletInfoBar'
import { ConversionCard } from './_components/conversionCard'
import { ConversionResult } from './_components/conversionResult'

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
  const [conversionData, setConversionData] = useState<ConversionData>({
    convertedAmount: null,
    currencyMode: 'USD',
    inputValue: '',
    error: null,
  })
  const conversionResultRef = useRef<HTMLElement>(null)
  const conversionSectionRef = useRef<HTMLElement>(null)

  // Scroll to position input field optimally on small screens when focused
  const handleInputFocus = useCallback((inputElement: HTMLInputElement | null, cardContentElement: HTMLDivElement | null) => {
    // Only scroll on small screens (sm and below, which is < 640px)
    if (window.innerWidth < 640 && inputElement && cardContentElement) {
      // Small delay to ensure layout is stable and conversion result can render
      setTimeout(() => {
        const cardContentRect = cardContentElement.getBoundingClientRect()
        const currentScrollY = window.scrollY
        const fixedHeaderHeight = isConnected ? 112 : 128 // Approximate fixed header height (pt-28 = 112px, pt-32 = 128px)
        
        // Calculate optimal scroll position: position CardContent start just below fixed header
        // This will hide the page header, card title, and card description above
        const cardContentTop = cardContentRect.top + currentScrollY
        const targetScrollY = cardContentTop - fixedHeaderHeight - 8 // 8px padding for breathing room
        
        // Only scroll if CardContent is not already in optimal position
        const currentCardContentTop = cardContentRect.top
        const optimalTop = fixedHeaderHeight + 8
        if (Math.abs(currentCardContentTop - optimalTop) > 20) {
          window.scrollTo({
            top: targetScrollY,
            behavior: 'smooth',
          })
        }
      }, 150)
    }
  }, [isConnected])

  return (
    <main>
      <WalletInfoBar />
      <section className={`min-h-screen ${isConnected ? 'pt-28' : 'pt-32 md:pt-24'}`}>
        <section className="container mx-auto px-4 py-8">
          <section className="max-w-4xl mx-auto space-y-8">
            {/* Page header */}
            <header className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">wBTC Converter</h1>
              <p className="text-lg text-muted-foreground">
                Convert between USD and Wrapped Bitcoin (wBTC) on Ethereum Mainnet
              </p>
            </header>

            {/* Conversion card */}
            <section className="space-y-4" aria-label="Currency conversion interface" ref={conversionSectionRef}>
              <ConversionCard onConversionChange={setConversionData} onInputFocus={handleInputFocus} />
              
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
