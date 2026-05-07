import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { FastifyInstance } from 'fastify'
import { buildServer } from '../src/server.js'

vi.mock('../src/db.js', () => ({
  getDb: () => ({ mocked: true }),
  closeDb: async () => undefined
}))

vi.mock('../src/repos/events.js', () => ({
  listEvents: async () => [
    {
      id: 'ftx_collapse',
      nameKo: 'FTX 파산',
      nameEn: 'FTX Collapse',
      eventDate: '2022-11-11',
      category: 'crisis',
      region: 'global',
      description: '설명',
      sourceUrl: 'https://example.com/ftx'
    },
    ...Array.from({ length: 20 }, (_, index) => ({
      id: `event_${index + 1}`,
      nameKo: `이벤트 ${index + 1}`,
      nameEn: `Event ${index + 1}`,
      eventDate: '2022-01-01',
      category: 'rally',
      region: 'global',
      description: '설명',
      sourceUrl: null
    }))
  ],
  getEventById: async (_db: unknown, eventId: string) =>
    eventId === 'ftx_collapse'
      ? {
          id: 'ftx_collapse',
          nameKo: 'FTX 파산',
          nameEn: 'FTX Collapse',
          eventDate: '2022-11-11',
          category: 'crisis',
          region: 'global',
          description: '설명',
          sourceUrl: 'https://example.com/ftx'
        }
      : null,
  getEventWindow: async () =>
    Array.from({ length: 15 }, (_, index) => ({
      dayOffset: index - 7,
      date: `2022-11-${String(index + 4).padStart(2, '0')}`,
      whaleVolumeUsd: '100.00',
      cexInflowUsd: '50.00',
      cexOutflowUsd: '25.00',
      ethPriceUsd: '1200.00',
      btcPriceUsd: '18000.00',
      fearGreedValue: 20,
      newsVolume: index % 3
    })),
  getEventNews: async () => [
    {
      id: '1',
      source: 'coindesk',
      url: 'https://example.com/news',
      title: 'FTX 뉴스',
      summary: '요약',
      publishedAt: '2022-11-11T00:00:00Z',
      language: 'en'
    }
  ]
}))

vi.mock('../src/repos/series.js', () => ({
  getWhaleFlows: async () => [
    {
      weekStart: '2022-11-07',
      asset: 'ETH',
      transferCount: '10',
      totalVolumeNative: '100.00',
      totalVolumeUsd: '1000000.00'
    }
  ],
  getCexFlows: async () => [
    {
      flowDate: '2022-11-11',
      asset: 'ETH',
      direction: 'inflow',
      transferCount: '5',
      totalVolumeNative: '50.00',
      totalVolumeUsd: '500000.00'
    }
  ],
  getPrices: async () => [
    {
      priceDate: '2022-11-11',
      asset: 'ETH',
      priceUsd: '1200.00',
      volumeUsd: '1000.00',
      marketCapUsd: '2000.00'
    }
  ],
  getFearGreed: async () => [
    {
      indexDate: '2022-11-11',
      value: 20,
      classification: 'Fear'
    }
  ]
}))

let app: FastifyInstance

beforeAll(async () => {
  app = await buildServer()
})

afterAll(async () => {
  await app.close()
})

describe('api routes', () => {
  it('returns health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })


  it('allows both localhost and 127 loopback frontend origins during local development', async () => {
    const localhostResponse = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:5173' }
    })
    const loopbackResponse = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://127.0.0.1:5173' }
    })

    expect(localhostResponse.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(loopbackResponse.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173')
  })

  it('returns events', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/events' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as Array<{ id: string }>
    expect(payload.length).toBe(21)
    expect(payload.some((item) => item.id === 'ftx_collapse')).toBe(true)
  })

  it('returns event window', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/events/ftx_collapse/window' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as { window: Array<{ dayOffset: number; newsVolume: number }> }
    expect(payload.window).toHaveLength(15)
    expect(payload.window[0]?.newsVolume).toBe(0)
  })

  it('returns event news', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/events/ftx_collapse/news?limit=5' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as Array<{ url: string }>
    expect(payload.length).toBeGreaterThan(0)
  })

  it('returns fear greed series', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/fear-greed?from=2022-11-04&to=2022-11-18' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as Array<{ indexDate: string }>
    expect(payload.length).toBeGreaterThan(0)
  })
})
