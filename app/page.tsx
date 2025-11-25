
import { WalletInfoBar } from './_components/walletInfoBar'
import { ConversionCard } from './_components/conversionCard'

/**
 * Home Page
 * Main page for USD <-> wBTC conversion application
 * Features:
 * - Fixed header with wallet/network info
 * - Conversion card with real-time price data
 */
export default function Home() {
  return (
    <main>
      <WalletInfoBar />
      <section className="pt-24 min-h-screen">
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
              <ConversionCard />
            </section>
          </section>
        </section>
      </section>
    </main>
  )
}
