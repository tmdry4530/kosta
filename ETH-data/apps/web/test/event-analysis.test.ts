import { describe, expect, it } from 'vitest'

import {
  analyzeEventWindow,
  buildCategoryComparisonData,
  buildHypothesisCards,
  buildRegionComparisonData
} from '../src/lib/eventAnalysis'

const sampleWindow = [
  { dayOffset: -2, date: '2022-11-09', whaleVolumeUsd: '100', cexInflowUsd: '50', cexOutflowUsd: '25', ethPriceUsd: '1100', btcPriceUsd: '18000', fearGreedValue: 30, newsVolume: 1 },
  { dayOffset: -1, date: '2022-11-10', whaleVolumeUsd: '100', cexInflowUsd: '50', cexOutflowUsd: '25', ethPriceUsd: '1100', btcPriceUsd: '18000', fearGreedValue: 28, newsVolume: 3 },
  { dayOffset: 0, date: '2022-11-11', whaleVolumeUsd: '300', cexInflowUsd: '150', cexOutflowUsd: '80', ethPriceUsd: '1000', btcPriceUsd: '17000', fearGreedValue: 20, newsVolume: 6 },
  { dayOffset: 1, date: '2022-11-12', whaleVolumeUsd: '220', cexInflowUsd: '70', cexOutflowUsd: '60', ethPriceUsd: '900', btcPriceUsd: '16500', fearGreedValue: 18, newsVolume: 2 },
  { dayOffset: 2, date: '2022-11-13', whaleVolumeUsd: '200', cexInflowUsd: '60', cexOutflowUsd: '50', ethPriceUsd: '880', btcPriceUsd: '16400', fearGreedValue: 17, newsVolume: 1 }
] as const

describe('eventAnalysis', () => {
  it('calculates before/event/after snapshots for an event window', () => {
    const summary = analyzeEventWindow([...sampleWindow])

    expect(summary.inflow.before).toBe(50)
    expect(summary.inflow.eventDay).toBe(150)
    expect(summary.inflow.after).toBe(65)
    expect(summary.inflow.eventVsBeforePct).toBe(200)
    expect(summary.ethPrice.afterVsBeforePct).toBeCloseTo(-19.09, 2)
    expect(summary.newsVolume.eventDay).toBe(6)
    expect(summary.peakNewsVolume).toBe(6)
  })

  it('builds readable hypothesis cards with verdict labels', () => {
    const summary = analyzeEventWindow([...sampleWindow])
    const cards = buildHypothesisCards(
      {
        id: 'ftx_collapse',
        nameKo: 'FTX 파산',
        nameEn: 'FTX Collapse',
        eventDate: '2022-11-11',
        category: 'crisis',
        region: 'global',
        description: '설명',
        sourceUrl: null
      },
      summary
    )

    expect(cards).toHaveLength(3)
    expect(cards.map((card) => card.badge.split(' · ')[0])).toEqual(['가설 1', '가설 3', '가설 4'])
    expect(cards[0]?.validation).toContain('+200.0%')
  })

  it('shows rally-specific hypotheses for rally events', () => {
    const summary = analyzeEventWindow([...sampleWindow])
    const cards = buildHypothesisCards(
      {
        id: 'btc_etf_approval',
        nameKo: '미국 BTC 현물 ETF 승인',
        nameEn: 'ETF',
        eventDate: '2024-01-10',
        category: 'rally',
        region: 'global',
        description: '설명',
        sourceUrl: null
      },
      summary
    )

    expect(cards.map((card) => card.badge.split(' · ')[0])).toEqual(['가설 2', '가설 4'])
  })

  it('does not support the rally hypothesis when outflow itself did not increase', () => {
    const weakRallyWindow = [
      { ...sampleWindow[0], cexInflowUsd: '50', cexOutflowUsd: '80' },
      { ...sampleWindow[1], cexInflowUsd: '50', cexOutflowUsd: '80' },
      { ...sampleWindow[2], cexInflowUsd: '120', cexOutflowUsd: '60' },
      sampleWindow[3],
      sampleWindow[4]
    ]
    const summary = analyzeEventWindow(weakRallyWindow)
    const cards = buildHypothesisCards(
      {
        id: 'btc_etf_approval',
        nameKo: '미국 BTC 현물 ETF 승인',
        nameEn: 'ETF',
        eventDate: '2024-01-10',
        category: 'rally',
        region: 'global',
        description: '설명',
        sourceUrl: null
      },
      summary
    )

    expect(cards[0]?.badge).toContain('반대')
  })

  it('aggregates category and region comparison data from event responses', () => {
    const responses = [
      {
        event: {
          id: 'ftx_collapse',
          nameKo: 'FTX 파산',
          nameEn: 'FTX Collapse',
          eventDate: '2022-11-11',
          category: 'crisis',
          region: 'global',
          description: '설명',
          sourceUrl: null
        },
        window: [...sampleWindow]
      },
      {
        event: {
          id: 'kr_user_protection_act',
          nameKo: '가상자산 이용자 보호법 시행',
          nameEn: 'Act',
          eventDate: '2024-07-19',
          category: 'regulation',
          region: 'kr',
          description: '설명',
          sourceUrl: null
        },
        window: [...sampleWindow]
      }
    ]

    expect(buildCategoryComparisonData(responses).map((item) => item.label)).toEqual(['위기', '규제'])
    expect(buildRegionComparisonData(responses).map((item) => item.label)).toEqual(['글로벌', '한국'])
  })
})
