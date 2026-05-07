import { z } from 'zod'

export const eventSchema = z.object({
  id: z.string(),
  nameKo: z.string(),
  nameEn: z.string(),
  eventDate: z.string(),
  category: z.string(),
  region: z.string(),
  description: z.string(),
  sourceUrl: z.string().nullable()
})

export const whaleFlowSchema = z.object({
  weekStart: z.string(),
  asset: z.string(),
  transferCount: z.string(),
  totalVolumeNative: z.string(),
  totalVolumeUsd: z.string()
})

export const eventWindowSchema = z.object({
  dayOffset: z.number(),
  date: z.string(),
  whaleVolumeUsd: z.string().nullable(),
  cexInflowUsd: z.string().nullable(),
  cexOutflowUsd: z.string().nullable(),
  ethPriceUsd: z.string().nullable(),
  btcPriceUsd: z.string().nullable(),
  fearGreedValue: z.number().nullable(),
  newsVolume: z.number().int()
})

export const eventWindowResponseSchema = z.object({
  event: eventSchema,
  window: z.array(eventWindowSchema)
})

export const newsArticleSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  publishedAt: z.string().nullable(),
  language: z.string().nullable()
})

export const fearGreedSchema = z.object({
  indexDate: z.string(),
  value: z.number(),
  classification: z.string()
})

export const eventListSchema = z.array(eventSchema)
export const whaleFlowListSchema = z.array(whaleFlowSchema)
export const newsListSchema = z.array(newsArticleSchema)
export const fearGreedListSchema = z.array(fearGreedSchema)
