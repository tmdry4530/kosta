import type { FastifyInstance } from 'fastify'

import { getCached, setCached } from '../cache.js'
import { getDb } from '../db.js'
import { flowAssetSchema, assetSchema, dateSchema } from '../schemas/common.js'
import { getCexFlows, getFearGreed, getPrices, getWhaleFlows } from '../repos/series.js'

function queryKey(prefix: string, params: unknown): string {
  return `${prefix}:${JSON.stringify(params)}`
}

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    details: {}
  },
  required: ['error']
} as const

const whaleFlowSchema = {
  type: 'object',
  properties: {
    weekStart: { type: 'string' },
    asset: { type: 'string' },
    transferCount: { type: 'string' },
    totalVolumeNative: { type: 'string' },
    totalVolumeUsd: { type: 'string' }
  },
  required: ['weekStart', 'asset', 'transferCount', 'totalVolumeNative', 'totalVolumeUsd']
} as const

const cexFlowSchema = {
  type: 'object',
  properties: {
    flowDate: { type: 'string' },
    asset: { type: 'string' },
    direction: { type: 'string' },
    transferCount: { type: 'string' },
    totalVolumeNative: { type: 'string' },
    totalVolumeUsd: { type: 'string' }
  },
  required: ['flowDate', 'asset', 'direction', 'transferCount', 'totalVolumeNative', 'totalVolumeUsd']
} as const

const priceSchema = {
  type: 'object',
  properties: {
    priceDate: { type: 'string' },
    asset: { type: 'string' },
    priceUsd: { type: 'string' },
    volumeUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    marketCapUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] }
  },
  required: ['priceDate', 'asset', 'priceUsd', 'volumeUsd', 'marketCapUsd']
} as const

const fearGreedSchema = {
  type: 'object',
  properties: {
    indexDate: { type: 'string' },
    value: { type: 'integer' },
    classification: { type: 'string' }
  },
  required: ['indexDate', 'value', 'classification']
} as const

export async function registerSeriesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/whale-flows', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          asset: { type: 'string', enum: ['ETH', 'USDT', 'USDC'] }
        },
        required: ['from', 'to', 'asset']
      },
      response: {
        200: { type: 'array', items: whaleFlowSchema },
        400: errorResponseSchema
      }
    }
  }, async (request) => {
    const raw = request.query as { from?: string; to?: string; asset?: string }
    const filters = {
      from: dateSchema.parse(raw.from),
      to: dateSchema.parse(raw.to),
      asset: flowAssetSchema.parse(raw.asset)
    }
    const key = queryKey('whale-flows', filters)
    const cached = getCached(key)
    if (cached !== undefined) return cached
    return setCached(key, await getWhaleFlows(getDb(), filters))
  })

  app.get('/api/cex-flows', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          asset: { type: 'string', enum: ['ETH', 'USDT', 'USDC'] }
        },
        required: ['from', 'to']
      },
      response: {
        200: { type: 'array', items: cexFlowSchema },
        400: errorResponseSchema
      }
    }
  }, async (request) => {
    const raw = request.query as { from?: string; to?: string; asset?: string }
    const filters = {
      from: dateSchema.parse(raw.from),
      to: dateSchema.parse(raw.to),
      asset: raw.asset === undefined ? undefined : flowAssetSchema.parse(raw.asset)
    }
    const key = queryKey('cex-flows', filters)
    const cached = getCached(key)
    if (cached !== undefined) return cached
    return setCached(key, await getCexFlows(getDb(), filters))
  })

  app.get('/api/prices', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          asset: { type: 'string', enum: ['ETH', 'BTC'] }
        },
        required: ['from', 'to', 'asset']
      },
      response: {
        200: { type: 'array', items: priceSchema },
        400: errorResponseSchema
      }
    }
  }, async (request) => {
    const raw = request.query as { from?: string; to?: string; asset?: string }
    const filters = {
      from: dateSchema.parse(raw.from),
      to: dateSchema.parse(raw.to),
      asset: assetSchema.exclude(['USDT', 'USDC']).parse(raw.asset)
    }
    const key = queryKey('prices', filters)
    const cached = getCached(key)
    if (cached !== undefined) return cached
    return setCached(key, await getPrices(getDb(), filters))
  })

  app.get('/api/fear-greed', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' }
        },
        required: ['from', 'to']
      },
      response: {
        200: { type: 'array', items: fearGreedSchema },
        400: errorResponseSchema
      }
    }
  }, async (request) => {
    const raw = request.query as { from?: string; to?: string }
    const filters = {
      from: dateSchema.parse(raw.from),
      to: dateSchema.parse(raw.to)
    }
    const key = queryKey('fear-greed', filters)
    const cached = getCached(key)
    if (cached !== undefined) return cached
    return setCached(key, await getFearGreed(getDb(), filters))
  })
}
