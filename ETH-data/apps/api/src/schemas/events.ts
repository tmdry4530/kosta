import { z } from 'zod'

import { dateSchema } from './common.js'

export const eventSchema = z.object({
  id: z.string(),
  nameKo: z.string(),
  nameEn: z.string(),
  eventDate: dateSchema,
  category: z.string(),
  region: z.string(),
  description: z.string(),
  sourceUrl: z.string().nullable()
})

export const eventWindowRowSchema = z.object({
  dayOffset: z.number().int(),
  date: dateSchema,
  whaleVolumeUsd: z.string().nullable(),
  cexInflowUsd: z.string().nullable(),
  cexOutflowUsd: z.string().nullable(),
  ethPriceUsd: z.string().nullable(),
  btcPriceUsd: z.string().nullable(),
  fearGreedValue: z.number().int().nullable(),
  newsVolume: z.number().int()
})

export const newsArticleSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string().url(),
  title: z.string(),
  summary: z.string().nullable(),
  publishedAt: z.string().nullable(),
  language: z.string().nullable()
})
