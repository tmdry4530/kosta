import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { getCached, setCached } from '../cache.js'
import { getDb } from '../db.js'
import { HttpError } from '../errors.js'
import { getEventById, getEventNews, getEventWindow, listEvents } from '../repos/events.js'
import { daysSchema, limitSchema } from '../schemas/common.js'

function queryKey(prefix: string, params: unknown): string {
  return `${prefix}:${JSON.stringify(params)}`
}

const eventQuerySchema = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    details: {}
  },
  required: ['error']
} as const

const eventSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    nameKo: { type: 'string' },
    nameEn: { type: 'string' },
    eventDate: { type: 'string' },
    category: { type: 'string' },
    region: { type: 'string' },
    description: { type: 'string' },
    sourceUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] }
  },
  required: ['id', 'nameKo', 'nameEn', 'eventDate', 'category', 'region', 'description', 'sourceUrl']
} as const

const windowRowSchema = {
  type: 'object',
  properties: {
    dayOffset: { type: 'integer' },
    date: { type: 'string' },
    whaleVolumeUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    cexInflowUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    cexOutflowUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    ethPriceUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    btcPriceUsd: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    fearGreedValue: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    newsVolume: { type: 'integer' }
  },
  required: [
    'dayOffset',
    'date',
    'whaleVolumeUsd',
    'cexInflowUsd',
    'cexOutflowUsd',
    'ethPriceUsd',
    'btcPriceUsd',
    'fearGreedValue',
    'newsVolume'
  ]
} as const

const newsSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    source: { type: 'string' },
    url: { type: 'string' },
    title: { type: 'string' },
    summary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    publishedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    language: { anyOf: [{ type: 'string' }, { type: 'null' }] }
  },
  required: ['id', 'source', 'url', 'title', 'summary', 'publishedAt', 'language']
} as const

export async function registerEventRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/events',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            region: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: eventSchema
          },
          400: errorResponseSchema
        }
      }
    },
    async (request) => {
      const params = eventQuerySchema.parse(request.query)
      const key = queryKey('events', params)
      const cached = getCached(key)
      if (cached !== undefined) return cached
      const result = await listEvents(getDb(), params)
      return setCached(key, result)
    }
  )

  app.get(
    '/api/events/:id/window',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        },
        querystring: {
          type: 'object',
          properties: { days: { type: 'integer' } }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              event: eventSchema,
              window: { type: 'array', items: windowRowSchema }
            },
            required: ['event', 'window']
          },
          400: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    async (request) => {
      const params = request.params as { id: string }
      const query = request.query as { days?: string }
      const days = daysSchema.parse(query.days)
      if (days !== 7) {
        throw new HttpError(400, 'Only days=7 is supported in this project')
      }
      const event = await getEventById(getDb(), params.id)
      if (event === null) {
        throw new HttpError(404, 'Event not found')
      }
      const window = await getEventWindow(getDb(), params.id)
      return { event, window }
    }
  )

  app.get(
    '/api/events/:id/news',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        },
        querystring: {
          type: 'object',
          properties: { limit: { type: 'integer' } }
        },
        response: {
          200: { type: 'array', items: newsSchema },
          400: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    async (request) => {
      const params = request.params as { id: string }
      const query = request.query as { limit?: string }
      const limit = limitSchema.parse(query.limit)
      const event = await getEventById(getDb(), params.id)
      if (event === null) {
        throw new HttpError(404, 'Event not found')
      }
      return getEventNews(getDb(), params.id, limit)
    }
  )
}
