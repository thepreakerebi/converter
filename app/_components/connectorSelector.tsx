'use client'

import { useConnect } from 'wagmi'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Label } from '@/components/ui/label' // Commented out - label removed for cleaner UI
import { useWalletStatus } from '@/hooks/useWalletStatus'
import { useMemo, useState, useEffect } from 'react'

/**
 * ConnectorSelector Component
 * Action trigger dropdown for choosing wallet connector (MetaMask or WalletConnect)
 * Always shows "Connect Wallet" placeholder - does not display selected value
 * Clicking an option triggers connection but does not set a selected state
 * Resets to placeholder if connection is cancelled or fails
 * Saved preference is handled by selectConnector() for future use, not for display
 */
export function ConnectorSelector() {
  const { connector, isConnected, selectConnector } = useWalletStatus()
  const { connect, error: connectError, reset: resetConnect } = useConnect()
  const [selectKey, setSelectKey] = useState(0) // Key to force Select reset

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

  // Reset Select component when connection fails or is cancelled
  useEffect(() => {
    if (connectError && !isConnected) {
      // Connection was cancelled or failed, reset the Select to show placeholder
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setSelectKey((prev) => prev + 1)
        resetConnect()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [connectError, isConnected, resetConnect])

  // Reset Select when connection succeeds (component will be hidden anyway)
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setSelectKey((prev) => prev + 1)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  const handleConnectorChange = (connectorId: string) => {
    // Save preference for future use
    selectConnector(connectorId)

    // Trigger connection with selected connector
    if (!isConnected) {
      const selectedConnector = connectors.find((c) => c.id === connectorId)
      if (selectedConnector) {
        try {
          connect(
            { connector: selectedConnector.factory() },
            {
              onError: (error) => {
                // Handle connection errors gracefully
                console.error('Connection error:', error)
                // Reset Select to show placeholder
                setSelectKey((prev) => prev + 1)
              },
            }
          )
        } catch (error) {
          console.error('Failed to connect:', error)
          // Reset Select to show placeholder
          setSelectKey((prev) => prev + 1)
        }
      }
    }
  }

  return (
    <section className="flex flex-col gap-2">
      {/* Label commented out - placeholder text is sufficient */}
      {/* <Label htmlFor="connector-select" className="text-sm font-medium">
        Wallet Connector
      </Label> */}
      <Select
        key={selectKey}
        value={undefined}
        onValueChange={handleConnectorChange}
        disabled={isConnected}
      >
        <SelectTrigger
          id="connector-select"
          aria-label="Select wallet connector"
          className="w-full sm:w-[200px]"
        >
          <SelectValue placeholder="Connect Wallet" />
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

