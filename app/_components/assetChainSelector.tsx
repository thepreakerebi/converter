'use client'

import { useMemo, useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getAllAssetChainCombinations,
  parseAssetChainKey,
  createAssetChainKey,
  type AssetChainCombination,
} from '@/lib/assets-config'
import { saveAssetChainPreference, loadAssetChainPreference } from '@/lib/storage'

/**
 * AssetChainSelector Component
 * Combined selector for asset and chain selection
 * Displays options as "{Asset Symbol} on {Chain Name}" (e.g., "wBTC on Ethereum Mainnet")
 * Similar pattern to ConnectorSelector - always shows placeholder when no selection
 */
export interface AssetChainSelectorProps {
  value?: string // Composite key like "wbtc-1"
  onValueChange?: (value: string, combination: AssetChainCombination | null) => void
  disabled?: boolean
  className?: string
}

export function AssetChainSelector({
  value,
  onValueChange,
  disabled = false,
  className,
}: AssetChainSelectorProps) {
  const [selectKey] = useState(0) // Key to force Select reset
  const [savedPreference, setSavedPreference] = useState<string | null>(null)

  // Get all valid asset-chain combinations
  const combinations = useMemo(() => getAllAssetChainCombinations(), [])

  // Load saved preference on mount, or use default if no value provided
  useEffect(() => {
    if (value) {
      // Value prop provided, use it
      return
    }

    const saved = loadAssetChainPreference()
    if (saved) {
      // Use saved preference
      setSavedPreference(saved)
      const parsed = parseAssetChainKey(saved)
      if (parsed && combinations.some((c) => c.assetId === parsed.assetId && c.chainId === parsed.chainId)) {
        const found = combinations.find((c) => c.assetId === parsed.assetId && c.chainId === parsed.chainId) ?? null
        onValueChange?.(saved, found)
      }
    } else {
      // No saved preference, use default: wBTC on Ethereum Mainnet
      const defaultCombination = combinations.find((c) => c.assetId === 'wbtc' && c.chainId === 1)
      if (defaultCombination) {
        const defaultKey = createAssetChainKey(defaultCombination.assetId, defaultCombination.chainId)
        setSavedPreference(defaultKey)
        onValueChange?.(defaultKey, defaultCombination)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - combinations is stable, onValueChange may change

  // Handle selection change
  const handleValueChange = (selectedKey: string) => {
    const parsed = parseAssetChainKey(selectedKey)
    if (!parsed) {
      onValueChange?.(selectedKey, null)
      return
    }

    const combination = combinations.find(
      (c) => c.assetId === parsed.assetId && c.chainId === parsed.chainId
    )

    if (combination) {
      // Save preference to localStorage
      saveAssetChainPreference(selectedKey)
      onValueChange?.(selectedKey, combination)
    } else {
      onValueChange?.(selectedKey, null)
    }
  }

  // Get display text for an option
  const getOptionText = (combination: AssetChainCombination): string => {
    return `${combination.asset.symbol} on ${combination.chain.name}`
  }

  // Get current selected combination for display
  const selectedCombination = useMemo(() => {
    const key = value || savedPreference
    if (!key) return null

    const parsed = parseAssetChainKey(key)
    if (!parsed) return null

    return (
      combinations.find(
        (c) => c.assetId === parsed.assetId && c.chainId === parsed.chainId
      ) ?? null
    )
  }, [value, savedPreference, combinations])

  return (
    <section className={`flex flex-col gap-2 ${className || ''}`}>
      <Select
        key={selectKey}
        value={value || savedPreference || undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id="asset-chain-select"
          aria-label="Select asset and chain"
          className="w-full sm:w-[240px]"
        >
          <SelectValue placeholder="Select Asset & Chain">
            {selectedCombination && getOptionText(selectedCombination)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {combinations.map((combination) => {
            const key = createAssetChainKey(combination.assetId, combination.chainId)
            return (
              <SelectItem key={key} value={key}>
                {getOptionText(combination)}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </section>
  )
}

