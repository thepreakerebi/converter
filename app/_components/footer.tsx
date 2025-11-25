'use client'

import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ExternalLink, Code, BookOpen, Github } from 'lucide-react'
import Link from 'next/link'

/**
 * Footer Component
 * Displays application information, instructions, and technical details
 */
export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <section className="container mx-auto px-4 py-8">
        <Accordion type="single" collapsible className="w-full">
          {/* How to Use */}
          <AccordionItem value="instructions">
            <AccordionTrigger>How to Use</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Connect your Web3 wallet (MetaMask or browser wallet)</li>
                <li>Ensure you&apos;re connected to Ethereum Mainnet</li>
                <li>Enter an amount in USD or wBTC using the input field</li>
                <li>Click &quot;Switch Currencies&quot; to toggle between USD and wBTC input</li>
                <li>Click &quot;Convert&quot; to see the equivalent amount</li>
                <li>View your wBTC balance in the header when connected</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Technical Stack */}
          <AccordionItem value="tech-stack">
            <AccordionTrigger>Technical Stack</AccordionTrigger>
            <AccordionContent>
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <section>
                  <h4 className="font-semibold mb-2">Frontend</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Next.js 16 (App Router)</li>
                    <li>• React 19</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Shadcn UI Components</li>
                  </ul>
                </section>
                <section>
                  <h4 className="font-semibold mb-2">Web3</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• wagmi v3</li>
                    <li>• viem</li>
                    <li>• React Query</li>
                    <li>• MetaMask Connector</li>
                    <li>• WalletConnect (optional)</li>
                  </ul>
                </section>
                <section>
                  <h4 className="font-semibold mb-2">APIs & Data</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• CoinGecko API (BTC price)</li>
                    <li>• Ethereum Mainnet RPC</li>
                    <li>• wBTC ERC-20 Contract</li>
                  </ul>
                </section>
                <section>
                  <h4 className="font-semibold mb-2">Testing & Quality</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Vitest</li>
                    <li>• Testing Library</li>
                    <li>• ESLint</li>
                    <li>• Prettier</li>
                  </ul>
                </section>
              </section>
            </AccordionContent>
          </AccordionItem>

          {/* Contract Information */}
          <AccordionItem value="contract-info">
            <AccordionTrigger>Contract Information</AccordionTrigger>
            <AccordionContent>
              <section className="space-y-3 text-sm">
                <section>
                  <p className="font-semibold">wBTC Contract Address (Ethereum Mainnet):</p>
                  <code className="block mt-1 p-2 bg-muted rounded font-mono text-xs break-all">
                    0x2260fac5e5542a773aa44fbcfedf7c193bc2c599
                  </code>
                </section>
                <section>
                  <p className="font-semibold">Network:</p>
                  <p className="text-muted-foreground">Ethereum Mainnet (Chain ID: 1)</p>
                </section>
                <section>
                  <p className="font-semibold">Token Standard:</p>
                  <p className="text-muted-foreground">ERC-20</p>
                </section>
              </section>
            </AccordionContent>
          </AccordionItem>

          {/* Resources */}
          <AccordionItem value="resources">
            <AccordionTrigger>Resources & Documentation</AccordionTrigger>
            <AccordionContent>
              <section className="space-y-3">
                <Link
                  href="https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  CoinGecko API Documentation
                </Link>
                <Link
                  href="https://etherscan.io/token/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  wBTC Contract on Etherscan
                </Link>
                <Link
                  href="https://wagmi.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  wagmi Documentation
                </Link>
                <Link
                  href="https://viem.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  viem Documentation
                </Link>
              </section>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator className="my-6" />

        {/* Footer credits */}
        <section className="text-center text-sm text-muted-foreground">
          <p>
            Built with{' '}
            <Link
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Next.js
            </Link>
            ,{' '}
            <Link
              href="https://wagmi.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              wagmi
            </Link>
            , and{' '}
            <Link
              href="https://viem.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              viem
            </Link>
          </p>
          <p className="mt-2">
            Price data provided by{' '}
            <Link
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              CoinGecko
            </Link>
          </p>
        </section>
      </section>
    </footer>
  )
}

