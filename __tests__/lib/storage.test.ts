import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveConnectorPreference,
  loadConnectorPreference,
  saveChainPreference,
  loadChainPreference,
  clearPreferences,
} from '../../lib/storage'

describe('Storage Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('saveConnectorPreference', () => {
    it('should save connector preference to localStorage', () => {
      saveConnectorPreference('metaMask')
      expect(localStorage.getItem('wagmi_connector_preference')).toBe('metaMask')
    })

    it('should overwrite existing connector preference', () => {
      saveConnectorPreference('metaMask')
      saveConnectorPreference('walletConnect')
      expect(localStorage.getItem('wagmi_connector_preference')).toBe('walletConnect')
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      saveConnectorPreference('metaMask')
      expect(consoleSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('loadConnectorPreference', () => {
    it('should load connector preference from localStorage', () => {
      localStorage.setItem('wagmi_connector_preference', 'metaMask')
      expect(loadConnectorPreference()).toBe('metaMask')
    })

    it('should return null if no preference is stored', () => {
      expect(loadConnectorPreference()).toBeNull()
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = loadConnectorPreference()
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      getItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('saveChainPreference', () => {
    it('should save chain preference to localStorage', () => {
      saveChainPreference(1)
      expect(localStorage.getItem('wagmi_chain_preference')).toBe('1')
    })

    it('should save testnet chain ID', () => {
      saveChainPreference(11155111) // Sepolia
      expect(localStorage.getItem('wagmi_chain_preference')).toBe('11155111')
    })

    it('should overwrite existing chain preference', () => {
      saveChainPreference(1)
      saveChainPreference(11155111)
      expect(localStorage.getItem('wagmi_chain_preference')).toBe('11155111')
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      saveChainPreference(1)
      expect(consoleSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('loadChainPreference', () => {
    it('should load chain preference from localStorage', () => {
      localStorage.setItem('wagmi_chain_preference', '1')
      expect(loadChainPreference()).toBe(1)
    })

    it('should parse chain ID as number', () => {
      localStorage.setItem('wagmi_chain_preference', '11155111')
      expect(loadChainPreference()).toBe(11155111)
    })

    it('should return null if no preference is stored', () => {
      expect(loadChainPreference()).toBeNull()
    })

    it('should return null if stored value is not a valid number', () => {
      localStorage.setItem('wagmi_chain_preference', 'invalid')
      expect(loadChainPreference()).toBeNull()
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = loadChainPreference()
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      getItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('clearPreferences', () => {
    it('should clear all preferences', () => {
      localStorage.setItem('wagmi_connector_preference', 'metaMask')
      localStorage.setItem('wagmi_chain_preference', '1')

      clearPreferences()

      expect(localStorage.getItem('wagmi_connector_preference')).toBeNull()
      expect(localStorage.getItem('wagmi_chain_preference')).toBeNull()
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      clearPreferences()
      expect(consoleSpy).toHaveBeenCalled()

      removeItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })
})

