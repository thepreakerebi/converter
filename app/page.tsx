
'use client'

import { useState } from 'react'
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
            <section aria-label="Currency conversion interface">
              <ConversionCard onConversionChange={setConversionData} />
            </section>

            {/* Conversion result */}
            <ConversionResult
              convertedAmount={conversionData.convertedAmount}
              currencyMode={conversionData.currencyMode}
              inputValue={conversionData.inputValue}
              error={conversionData.error}
            />
          </section>
        </section>
      </section>
    </main>
  )
}
