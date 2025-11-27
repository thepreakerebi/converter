'use client'

import { useReducer, useCallback } from 'react'
import { bridgeReducer, type BridgeState } from '@/lib/bridge-state-machine'
import { bridgeFormSchema, type BridgeFormData } from '@/lib/bridge-schema'
import { toast } from 'sonner'
import { ZodError } from 'zod'

/**
 * Hook return type for useBridgeTransaction
 */
export interface UseBridgeTransactionReturn {
  state: BridgeState
  submitTransaction: (data: BridgeFormData) => Promise<void>
  retryTransaction: () => Promise<void>
  resetTransaction: () => void
  isSubmitting: boolean
  canRetry: boolean
}

/**
 * Custom hook for managing bridge transaction state and API calls
 * Handles form validation, API calls, retry logic, and state management
 */
export function useBridgeTransaction(): UseBridgeTransactionReturn {
  const [state, dispatch] = useReducer(bridgeReducer, { status: 'idle' })

  /**
   * Submit bridge transaction
   * Validates form data, calls API, and manages state transitions
   */
  const submitTransaction = useCallback(async (data: BridgeFormData) => {
    // Start validation
    dispatch({ type: 'SUBMIT', payload: data })

    try {
      // Validate form data using zod schema
      const validatedData = bridgeFormSchema.parse(data)
      
      // Validation passed, move to submitting
      dispatch({ type: 'VALIDATE_SUCCESS', payload: validatedData })

      // Call bridge API
      const response = await fetch('/api/bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        // API returned error
        const errorMessage = result.error || 'Bridge transaction failed. Please try again.'
        dispatch({ type: 'API_ERROR', payload: errorMessage })
        toast.error(errorMessage)
        return
      }

      // API call succeeded - transaction pending
      dispatch({ 
        type: 'API_SUCCESS', 
        payload: { transactionId: result.transactionId } 
      })
      
      // Simulate pending → confirmed transition after delay
      // In a real app, this would be handled by polling or websocket
      setTimeout(() => {
        dispatch({ 
          type: 'API_SUCCESS', 
          payload: { transactionId: result.transactionId } 
        })
        toast.success('Bridge transaction confirmed!')
      }, 2000)

    } catch (error) {
      // Check if it's a ZodError
      if (error instanceof ZodError) {
        // Validation error - ZodError has an 'issues' property, not 'errors'
        const firstIssue = error.issues[0]
        const errorMessage = firstIssue 
          ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
          : 'Validation failed. Please check your input.'
        dispatch({ type: 'VALIDATE_ERROR', payload: errorMessage })
        toast.error(errorMessage)
      } else {
        // Network or other error
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Bridge transaction failed. Please try again.'
        dispatch({ type: 'API_ERROR', payload: errorMessage })
        toast.error(errorMessage)
      }
    }
  }, [])

  /**
   * Retry failed transaction
   * Moves from failed → retrying → submitting
   */
  const retryTransaction = useCallback(async () => {
    if (state.status === 'failed') {
      dispatch({ type: 'RETRY' })
      // After retrying state, move to submitting
      setTimeout(() => {
        dispatch({ type: 'RETRY' })
        // Re-submit with same form data
        if ('formData' in state) {
          submitTransaction(state.formData)
        }
      }, 500)
    }
  }, [state, submitTransaction])

  /**
   * Reset transaction to idle state
   */
  const resetTransaction = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // Helper properties
  const isSubmitting = 
    state.status === 'validating' ||
    state.status === 'submitting' ||
    state.status === 'pending' ||
    state.status === 'retrying'

  const canRetry = state.status === 'failed'

  return {
    state,
    submitTransaction,
    retryTransaction,
    resetTransaction,
    isSubmitting,
    canRetry,
  }
}

