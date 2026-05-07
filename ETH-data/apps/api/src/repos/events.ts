import { type Sql } from 'postgres'

import type { EventRecord, EventWindowRow, NewsArticle } from '../types.js'

export async function listEvents(
  db: Sql,
  filters: { category?: string; region?: string; from?: string; to?: string }
): Promise<EventRecord[]> {
  const rows = await db<{
    id: string
    nameKo: string
    nameEn: string
    eventDate: string
    category: string
    region: string
    description: string
    sourceUrl: string | null
  }[]>`
    SELECT
      id,
      name_ko AS "nameKo",
      name_en AS "nameEn",
      to_char(event_date, 'YYYY-MM-DD') AS "eventDate",
      category,
      region,
      description,
      source_url AS "sourceUrl"
    FROM events
    WHERE (${filters.category ?? null}::text IS NULL OR category = ${filters.category ?? null})
      AND (${filters.region ?? null}::text IS NULL OR region = ${filters.region ?? null})
      AND (${filters.from ?? null}::date IS NULL OR event_date >= ${filters.from ?? null})
      AND (${filters.to ?? null}::date IS NULL OR event_date <= ${filters.to ?? null})
    ORDER BY event_date, id
  `

  return rows.map((row) => ({ ...row }))
}

export async function getEventById(db: Sql, eventId: string): Promise<EventRecord | null> {
  const rows = await db<{
    id: string
    nameKo: string
    nameEn: string
    eventDate: string
    category: string
    region: string
    description: string
    sourceUrl: string | null
  }[]>`
    SELECT
      id,
      name_ko AS "nameKo",
      name_en AS "nameEn",
      to_char(event_date, 'YYYY-MM-DD') AS "eventDate",
      category,
      region,
      description,
      source_url AS "sourceUrl"
    FROM events
    WHERE id = ${eventId}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function getEventWindow(db: Sql, eventId: string): Promise<EventWindowRow[]> {
  const rows = await db<{
    dayOffset: number
    date: string
    whaleVolumeUsd: string | null
    cexInflowUsd: string | null
    cexOutflowUsd: string | null
    ethPriceUsd: string | null
    btcPriceUsd: string | null
    fearGreedValue: number | null
    newsVolume: number
  }[]>`
    SELECT
      ew.day_offset AS "dayOffset",
      to_char((e.event_date + ew.day_offset), 'YYYY-MM-DD') AS date,
      ew.whale_volume_usd::text AS "whaleVolumeUsd",
      ew.cex_inflow_usd::text AS "cexInflowUsd",
      ew.cex_outflow_usd::text AS "cexOutflowUsd",
      ew.eth_price_usd::text AS "ethPriceUsd",
      ew.btc_price_usd::text AS "btcPriceUsd",
      ew.fear_greed_value AS "fearGreedValue",
      COALESCE((
        SELECT count(*)::int
        FROM news_articles AS na
        WHERE na.event_id = ew.event_id
          AND na.published_at IS NOT NULL
          AND (na.published_at AT TIME ZONE 'UTC')::date = (e.event_date + ew.day_offset)
      ), 0) AS "newsVolume"
    FROM event_windows AS ew
    JOIN events AS e ON e.id = ew.event_id
    WHERE ew.event_id = ${eventId}
    ORDER BY ew.day_offset
  `

  return rows.map((row) => ({ ...row }))
}

export async function getEventNews(db: Sql, eventId: string, limit: number): Promise<NewsArticle[]> {
  const rows = await db<{
    id: string
    source: string
    url: string
    title: string
    summary: string | null
    publishedAt: string | null
    language: string | null
  }[]>`
    SELECT
      id::text AS id,
      source,
      url,
      title,
      summary,
      to_char(published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "publishedAt",
      language
    FROM news_articles
    WHERE event_id = ${eventId}
    ORDER BY published_at DESC NULLS LAST, id DESC
    LIMIT ${limit}
  `

  return rows.map((row) => ({ ...row }))
}
