import { z } from 'zod'

export const assetSchema = z.enum(['ETH', 'USDT', 'USDC', 'BTC'])
export const flowAssetSchema = z.enum(['ETH', 'USDT', 'USDC'])
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const errorSchema = z.object({
  error: z.string(),
  details: z.unknown().optional()
})

export const daysSchema = z.coerce.number().int().min(1).max(30).default(7)
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20)
