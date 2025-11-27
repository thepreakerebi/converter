import { z } from 'zod'

/**
 * Bridge form validation schema
 * Validates all fields required for bridge transactions:
 * - sourceChain: Chain ID of the source blockchain
 * - destinationChain: Chain ID of the destination blockchain
 * - asset: Asset ID (e.g., 'wbtc', 'usdc', 'dai')
 * - amount: Amount to bridge (must be positive number)
 * - recipientAddress: Wallet address on destination chain (must be valid Ethereum address)
 */
export const bridgeFormSchema = z.object({
  sourceChain: z.number().positive('Source chain ID must be a positive number'),
  destinationChain: z.number().positive('Destination chain ID must be a positive number'),
  asset: z.string().min(1, 'Asset is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
      },
      {
        message: 'Amount must be a positive number',
      }
    )
    .refine(
      (val) => {
        // Check decimal places (max 18 for most tokens)
        const parts = val.split('.')
        return parts.length <= 2 && (parts[1]?.length ?? 0) <= 18
      },
      {
        message: 'Amount must have at most 18 decimal places',
      }
    ),
  recipientAddress: z
    .string()
    .min(1, 'Recipient address is required')
    .refine(
      (val) => {
        // Basic Ethereum address validation (0x followed by 40 hex characters)
        return /^0x[a-fA-F0-9]{40}$/.test(val)
      },
      {
        message: 'Recipient address must be a valid Ethereum address (0x...)',
      }
    ),
})

/**
 * Type inference from bridge form schema
 * This type matches BridgeFormData interface in bridge-state-machine.ts
 */
export type BridgeFormData = z.infer<typeof bridgeFormSchema>

