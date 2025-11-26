import { z } from 'zod'

/**
 * Bridge form validation schema
 * Validates asset, chain, and amount fields for bridge transactions
 */
export const bridgeFormSchema = z.object({
  asset: z.string().min(1, 'Asset is required'),
  chain: z.number().positive('Chain ID must be a positive number'),
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
        // Check decimal places (max 8 for most tokens)
        const parts = val.split('.')
        return parts.length <= 2 && (parts[1]?.length ?? 0) <= 8
      },
      {
        message: 'Amount must have at most 8 decimal places',
      }
    ),
})

/**
 * Type inference from bridge form schema
 * This type matches BridgeFormData interface in bridge-state-machine.ts
 */
export type BridgeFormData = z.infer<typeof bridgeFormSchema>

