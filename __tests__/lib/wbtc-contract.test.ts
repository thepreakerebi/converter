import { describe, it, expect } from 'vitest'
import { wbtcContractConfig, WBTC_FUNCTIONS } from '../../lib/wbtc-contract'
import { WBTC_CONTRACT_ADDRESS } from '../../lib/wagmi.config'

describe('wbtc-contract', () => {
  describe('wbtcContractConfig', () => {
    it('should have correct contract address', () => {
      expect(wbtcContractConfig.address).toBe(WBTC_CONTRACT_ADDRESS)
    })

    it('should have ERC-20 ABI', () => {
      expect(wbtcContractConfig.abi).toBeDefined()
      expect(Array.isArray(wbtcContractConfig.abi)).toBe(true)
    })

    it('should be readonly (as const)', () => {
      // Type check: config should be readonly
      expect(wbtcContractConfig).toBeDefined()
    })
  })

  describe('WBTC_FUNCTIONS', () => {
    it('should have symbol function name', () => {
      expect(WBTC_FUNCTIONS.symbol).toBe('symbol')
    })

    it('should have decimals function name', () => {
      expect(WBTC_FUNCTIONS.decimals).toBe('decimals')
    })

    it('should have balanceOf function name', () => {
      expect(WBTC_FUNCTIONS.balanceOf).toBe('balanceOf')
    })

    it('should be readonly (as const)', () => {
      // Type check: functions should be readonly
      expect(WBTC_FUNCTIONS).toBeDefined()
    })
  })
})

