'use client'

import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import type { BridgeState } from '@/lib/bridge-state-machine'

/**
 * BridgeProgress Component
 * Visual stepper and progress indicator for bridge transactions
 * Shows current status, progress percentage, and action buttons
 */
export interface BridgeProgressProps {
  state: BridgeState
  onRetry?: () => void
  onReset?: () => void
}

export function BridgeProgress({ state, onRetry, onReset }: BridgeProgressProps) {
  // Calculate progress percentage based on state
  const getProgress = (): number => {
    switch (state.status) {
      case 'idle':
        return 0
      case 'validating':
        return 10
      case 'submitting':
        return 30
      case 'pending':
        return 60
      case 'confirmed':
        return 100
      case 'failed':
        return 0
      case 'retrying':
        return 30
      default:
        return 0
    }
  }

  // Get status message
  const getStatusMessage = (): { message: string; icon: React.ReactNode; variant: 'default' | 'destructive' } => {
    switch (state.status) {
      case 'idle':
        return {
          message: 'Ready to bridge',
          icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
          variant: 'default' as const,
        }
      case 'validating':
        return {
          message: 'Validating transaction...',
          icon: <Loader2 className="size-4 animate-spin" aria-hidden="true" />,
          variant: 'default' as const,
        }
      case 'submitting':
        return {
          message: 'Submitting bridge transaction...',
          icon: <Loader2 className="size-4 animate-spin" aria-hidden="true" />,
          variant: 'default' as const,
        }
      case 'pending':
        return {
          message: 'Transaction pending confirmation...',
          icon: <Loader2 className="size-4 animate-spin" aria-hidden="true" />,
          variant: 'default' as const,
        }
      case 'confirmed':
        return {
          message: 'Bridge transaction confirmed!',
          icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
          variant: 'default' as const,
        }
      case 'failed':
        return {
          message: state.error || 'Bridge transaction failed',
          icon: <AlertCircle className="size-4" aria-hidden="true" />,
          variant: 'destructive' as const,
        }
      case 'retrying':
        return {
          message: 'Retrying bridge transaction...',
          icon: <RefreshCw className="size-4 animate-spin" aria-hidden="true" />,
          variant: 'default' as const,
        }
      default:
        return {
          message: 'Unknown status',
          icon: <AlertCircle className="size-4" aria-hidden="true" />,
          variant: 'default' as const,
        }
    }
  }

  const progress = getProgress()
  const statusInfo = getStatusMessage()

  // Get transaction ID if available
  const transactionId = 'transactionId' in state ? state.transactionId : null

  return (
    <section className="space-y-4" aria-label="Bridge transaction progress">
      {/* Progress Bar */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" aria-label={`Bridge progress: ${progress}%`} />
      </section>

      {/* Status Alert */}
      <Alert variant={statusInfo.variant}>
        <div className="flex items-start gap-3">
          {statusInfo.icon}
          <div className="flex-1 space-y-1">
            <AlertDescription className="font-medium">{statusInfo.message}</AlertDescription>
            {transactionId && (
              <p className="text-xs text-muted-foreground font-mono">
                Transaction ID: {transactionId.slice(0, 10)}...{transactionId.slice(-8)}
              </p>
            )}
            {state.status === 'failed' && state.error && (
              <p className="text-xs text-muted-foreground mt-1">{state.error}</p>
            )}
          </div>
        </div>
      </Alert>

      {/* Enhanced Stepper Visualization */}
      <section className="space-y-4 py-4">
        <h3 className="text-sm font-medium text-muted-foreground">Transaction Status</h3>
        <div className="relative">
          {/* Stepper Steps */}
          <div className="flex items-start justify-between">
            {/* Step 1: Validating */}
            <div className="flex flex-col items-center gap-2 flex-1 relative">
              <div className="relative z-10">
                <div
                  className={`flex items-center justify-center size-10 rounded-full border-2 transition-all ${
                    state.status === 'validating'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : state.status === 'submitting' ||
                        state.status === 'pending' ||
                        state.status === 'confirmed'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {state.status === 'submitting' ||
                  state.status === 'pending' ||
                  state.status === 'confirmed' ? (
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  ) : state.status === 'validating' ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">1</span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  state.status === 'validating' ||
                  state.status === 'submitting' ||
                  state.status === 'pending' ||
                  state.status === 'confirmed'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Validating
              </span>
            </div>

            {/* Connecting Line 1 */}
            <div
              className={`absolute top-5 left-[25%] right-[25%] h-0.5 transition-all ${
                state.status === 'submitting' ||
                state.status === 'pending' ||
                state.status === 'confirmed'
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
              aria-hidden="true"
            />

            {/* Step 2: Submitting */}
            <div className="flex flex-col items-center gap-2 flex-1 relative">
              <div className="relative z-10">
                <div
                  className={`flex items-center justify-center size-10 rounded-full border-2 transition-all ${
                    state.status === 'submitting' || state.status === 'retrying'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : state.status === 'pending' || state.status === 'confirmed'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {state.status === 'pending' || state.status === 'confirmed' ? (
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  ) : state.status === 'submitting' || state.status === 'retrying' ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">2</span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  state.status === 'submitting' ||
                  state.status === 'retrying' ||
                  state.status === 'pending' ||
                  state.status === 'confirmed'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Submitting
              </span>
            </div>

            {/* Connecting Line 2 */}
            <div
              className={`absolute top-5 left-[50%] right-[25%] h-0.5 transition-all ${
                state.status === 'pending' || state.status === 'confirmed'
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
              aria-hidden="true"
            />

            {/* Step 3: Pending */}
            <div className="flex flex-col items-center gap-2 flex-1 relative">
              <div className="relative z-10">
                <div
                  className={`flex items-center justify-center size-10 rounded-full border-2 transition-all ${
                    state.status === 'pending'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : state.status === 'confirmed'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {state.status === 'confirmed' ? (
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  ) : state.status === 'pending' ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">3</span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  state.status === 'pending' || state.status === 'confirmed'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Pending
              </span>
            </div>

            {/* Connecting Line 3 */}
            <div
              className={`absolute top-5 left-[75%] right-[25%] h-0.5 transition-all ${
                state.status === 'confirmed' ? 'bg-primary' : 'bg-muted'
              }`}
              aria-hidden="true"
            />

            {/* Step 4: Confirmed */}
            <div className="flex flex-col items-center gap-2 flex-1 relative">
              <div className="relative z-10">
                <div
                  className={`flex items-center justify-center size-10 rounded-full border-2 transition-all ${
                    state.status === 'confirmed'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {state.status === 'confirmed' ? (
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">4</span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  state.status === 'confirmed' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Confirmed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      {state.status === 'failed' && onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="w-full h-12 md:h-9"
          aria-label="Retry bridge transaction"
        >
          <RefreshCw className="size-4 mr-2" aria-hidden="true" />
          Retry Transaction
        </Button>
      )}

      {state.status === 'confirmed' && onReset && (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="w-full h-12 md:h-9"
          aria-label="Start new bridge transaction"
        >
          Start New Bridge
        </Button>
      )}
    </section>
  )
}

