'use client'

import { useConnect } from 'wagmi'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Label } from '@/components/ui/label' // Commented out - label removed for cleaner UI
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { useMemo } from 'react'
import { loadConnectorPreference } from '@/lib/storage'

/**
 * ConnectorSelector Component
 * Dropdown selector for choosing wallet connector (MetaMask or WalletConnect)
 * Displays current connector status and persists selection
 */
export function ConnectorSelector() {
  const { connector, isConnected, selectConnector } = useWalletStatus()
  const { connect } = useConnect()

  // Get current connector ID or saved preference
  const currentConnectorId = useMemo(() => {
    return connector?.id ?? loadConnectorPreference() ?? ''
  }, [connector])

  // Available connectors with their factory functions
  const connectors = useMemo(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''
    const connectorList = [
      { id: 'io.metamask', name: 'MetaMask', factory: metaMask },
      { id: 'injected', name: 'Browser Wallet', factory: injected },
    ] as Array<{
      id: string
      name: string
      factory: typeof metaMask | typeof injected | (() => ReturnType<typeof walletConnect>)
    }>

    // Only include WalletConnect if project ID is available
    if (projectId) {
      connectorList.splice(1, 0, {
        id: 'walletConnect',
        name: 'WalletConnect',
        factory: () => walletConnect({ projectId }),
      } as typeof connectorList[number])
    }

    return connectorList
  }, [])

  const handleConnectorChange = (connectorId: string) => {
    selectConnector(connectorId)

    // If not connected, attempt to connect with selected connector
    if (!isConnected) {
      const selectedConnector = connectors.find((c) => c.id === connectorId)
      if (selectedConnector) {
        try {
          connect({ connector: selectedConnector.factory() })
        } catch (error) {
          console.error('Failed to connect:', error)
        }
      }
    }
  }

  const currentConnectorName = useMemo(() => {
    return connectors.find((c) => c.id === currentConnectorId)?.name ?? 'Select connector'
  }, [currentConnectorId, connectors])

  return (
    <section className="flex flex-col gap-2">
      {/* Label commented out - placeholder text is sufficient */}
      {/* <Label htmlFor="connector-select" className="text-sm font-medium">
        Wallet Connector
      </Label> */}
      <Select
        value={currentConnectorId || undefined}
        onValueChange={handleConnectorChange}
        disabled={isConnected}
      >
        <SelectTrigger
          id="connector-select"
          aria-label="Select wallet connector"
          className="w-full sm:w-[200px]"
        >
          <SelectValue placeholder="Connect Wallet">{currentConnectorName}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {connectors.map((conn) => (
            <SelectItem key={conn.id} value={conn.id}>
              {conn.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isConnected && connector && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Connected via {connector.name ?? 'wallet'}
        </p>
      )}
    </section>
  )
}

