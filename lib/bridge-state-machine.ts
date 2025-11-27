/**
 * Bridge Transaction State Machine
 * Manages the state transitions for bridge transactions using useReducer pattern
 *
 * States:
 * - idle: Initial state, no transaction
 * - validating: Form validation in progress
 * - submitting: API request in progress
 * - pending: Transaction pending confirmation
 * - confirmed: Transaction confirmed successfully
 * - failed: Transaction failed
 * - retrying: Retry in progress
 */

/**
 * Bridge form data structure
 * Matches the schema defined in bridge-schema.ts
 */
export interface BridgeFormData {
  sourceChain: number
  destinationChain: number
  asset: string
  amount: string
  recipientAddress: string
}

/**
 * Bridge transaction state types
 */
export type BridgeState =
  | { status: 'idle' }
  | { status: 'validating'; formData: BridgeFormData }
  | { status: 'submitting'; formData: BridgeFormData }
  | { status: 'pending'; transactionId: string; formData: BridgeFormData }
  | { status: 'confirmed'; transactionId: string; formData: BridgeFormData }
  | { status: 'failed'; error: string; formData: BridgeFormData }
  | { status: 'retrying'; error: string; formData: BridgeFormData }

/**
 * Bridge transaction actions
 */
export type BridgeAction =
  | { type: 'SUBMIT'; payload: BridgeFormData }
  | { type: 'VALIDATE_SUCCESS'; payload: BridgeFormData }
  | { type: 'VALIDATE_ERROR'; payload: string }
  | { type: 'API_SUCCESS'; payload: { transactionId: string } }
  | { type: 'API_ERROR'; payload: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }

/**
 * Bridge state machine reducer
 * Handles all state transitions for bridge transactions
 *
 * @param state - Current bridge state
 * @param action - Action to perform
 * @returns New bridge state
 */
export function bridgeReducer(state: BridgeState, action: BridgeAction): BridgeState {
  switch (action.type) {
    case 'SUBMIT':
      // Transition from idle to validating
      return {
        status: 'validating',
        formData: action.payload,
      }

    case 'VALIDATE_SUCCESS':
      // Validation passed, move to submitting
      if (state.status === 'validating') {
        return {
          status: 'submitting',
          formData: action.payload,
        }
      }
      return state

    case 'VALIDATE_ERROR':
      // Validation failed, return to idle with error
      if (state.status === 'validating') {
        return {
          status: 'failed',
          error: action.payload,
          formData: state.formData,
        }
      }
      return state

    case 'API_SUCCESS':
      // API call succeeded
      // From submitting → pending (first success response)
      if (state.status === 'submitting') {
        return {
          status: 'pending',
          transactionId: action.payload.transactionId,
          formData: state.formData,
        }
      }
      // From pending → confirmed (confirmation received)
      if (state.status === 'pending') {
        return {
          status: 'confirmed',
          transactionId: action.payload.transactionId,
          formData: state.formData,
        }
      }
      return state

    case 'API_ERROR':
      // API call failed, move to failed state
      if (state.status === 'submitting' || state.status === 'pending') {
        return {
          status: 'failed',
          error: action.payload,
          formData: state.formData,
        }
      }
      return state

    case 'RETRY':
      // Retry failed transaction - move from failed to retrying, then back to submitting
      if (state.status === 'failed') {
        return {
          status: 'retrying',
          error: state.error,
          formData: state.formData,
        }
      }
      if (state.status === 'retrying') {
        // When retrying, move back to submitting with same form data
        return {
          status: 'submitting',
          formData: state.formData,
        }
      }
      return state

    case 'RESET':
      // Reset to idle state
      return {
        status: 'idle',
      }

    default:
      return state
  }
}

/**
 * Helper function to check if state allows retry
 */
export function canRetry(state: BridgeState): boolean {
  return state.status === 'failed'
}

/**
 * Helper function to check if transaction is in progress
 */
export function isSubmitting(state: BridgeState): boolean {
  return (
    state.status === 'validating' ||
    state.status === 'submitting' ||
    state.status === 'pending' ||
    state.status === 'retrying'
  )
}

