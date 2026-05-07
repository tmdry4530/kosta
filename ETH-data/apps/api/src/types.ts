export type ApiError = {
  error: string
  details?: unknown
}

export type EventRecord = {
  id: string
  nameKo: string
  nameEn: string
  eventDate: string
  category: string
  region: string
  description: string
  sourceUrl: string | null
}

export type EventWindowRow = {
  dayOffset: number
  date: string
  whaleVolumeUsd: string | null
  cexInflowUsd: string | null
  cexOutflowUsd: string | null
  ethPriceUsd: string | null
  btcPriceUsd: string | null
  fearGreedValue: number | null
  newsVolume: number
}

export type NewsArticle = {
  id: string
  source: string
  url: string
  title: string
  summary: string | null
  publishedAt: string | null
  language: string | null
}
