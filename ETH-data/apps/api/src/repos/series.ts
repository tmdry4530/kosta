import { type Sql } from 'postgres'

export async function getWhaleFlows(
  db: Sql,
  filters: { from: string; to: string; asset: 'ETH' | 'USDT' | 'USDC' }
): Promise<Array<Record<string, string>>> {
  return db`
    SELECT
      to_char(week_start, 'YYYY-MM-DD') AS "weekStart",
      asset,
      transfer_count::text AS "transferCount",
      total_volume_native::text AS "totalVolumeNative",
      total_volume_usd::text AS "totalVolumeUsd"
    FROM whale_transfers
    WHERE week_start BETWEEN ${filters.from} AND ${filters.to}
      AND asset = ${filters.asset}
    ORDER BY week_start
  `
}

export async function getCexFlows(
  db: Sql,
  filters: { from: string; to: string; asset?: 'ETH' | 'USDT' | 'USDC' }
): Promise<Array<Record<string, string>>> {
  const assetFilter = filters.asset !== undefined ? db`AND asset = ${filters.asset}` : db``
  return db`
    SELECT
      to_char(flow_date, 'YYYY-MM-DD') AS "flowDate",
      asset,
      direction,
      transfer_count::text AS "transferCount",
      total_volume_native::text AS "totalVolumeNative",
      total_volume_usd::text AS "totalVolumeUsd"
    FROM cex_flows
    WHERE flow_date BETWEEN ${filters.from} AND ${filters.to}
      ${assetFilter}
    ORDER BY flow_date, asset, direction
  `
}

export async function getPrices(
  db: Sql,
  filters: { from: string; to: string; asset: 'ETH' | 'BTC' }
): Promise<Array<Record<string, string | null>>> {
  return db`
    SELECT
      to_char(price_date, 'YYYY-MM-DD') AS "priceDate",
      asset,
      price_usd::text AS "priceUsd",
      volume_usd::text AS "volumeUsd",
      market_cap_usd::text AS "marketCapUsd"
    FROM prices
    WHERE price_date BETWEEN ${filters.from} AND ${filters.to}
      AND asset = ${filters.asset}
    ORDER BY price_date
  `
}

export async function getFearGreed(
  db: Sql,
  filters: { from: string; to: string }
): Promise<Array<Record<string, string | number>>> {
  return db`
    SELECT
      to_char(index_date, 'YYYY-MM-DD') AS "indexDate",
      value,
      classification
    FROM fear_greed_index
    WHERE index_date BETWEEN ${filters.from} AND ${filters.to}
    ORDER BY index_date
  `
}
