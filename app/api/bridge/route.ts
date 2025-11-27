import { NextResponse } from 'next/server'
import type { BridgeFormData } from '@/lib/bridge-schema'

/**
 * Mock Bridge API Route
 * Simulates bridge transaction with latency and random success/failure
 * 
 * In a real application, this would:
 * - Validate transaction parameters
 * - Check user balance
 * - Initiate bridge contract interaction
 * - Return transaction hash
 * 
 * For this assessment, we simulate:
 * - 1-3 second latency
 * - 70% success rate, 30% failure rate
 * - Mock transaction ID on success
 * - Error message on failure
 */
export async function POST(request: Request) {
  try {
    const body: BridgeFormData = await request.json()

    // Validate required fields
    if (!body.sourceChain || !body.destinationChain || !body.asset || !body.amount || !body.recipientAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Simulate network latency (1-3 seconds)
    const latency = Math.random() * 2000 + 1000 // 1000-3000ms
    await new Promise((resolve) => setTimeout(resolve, latency))

    // Simulate random success/failure (70% success, 30% failure)
    const success = Math.random() > 0.3

    if (success) {
      // Generate mock transaction ID
      const transactionId = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`

      return NextResponse.json({
        success: true,
        transactionId,
        message: 'Bridge transaction initiated successfully',
      })
    } else {
      // Random failure reasons
      const failureReasons = [
        'Insufficient balance for bridge fees',
        'Bridge service temporarily unavailable',
        'Network congestion detected',
        'Invalid recipient address format',
        'Bridge contract interaction failed',
      ]
      const errorMessage = failureReasons[Math.floor(Math.random() * failureReasons.length)]

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

