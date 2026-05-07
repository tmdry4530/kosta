import type { z } from 'zod'

import type { eventSchema, eventWindowResponseSchema, eventWindowSchema } from '../api/schemas'

type EventRecord = z.infer<typeof eventSchema>
type EventWindow = z.infer<typeof eventWindowSchema>
type EventWindowResponse = z.infer<typeof eventWindowResponseSchema>

type MetricKey = 'whaleVolumeUsd' | 'cexInflowUsd' | 'cexOutflowUsd' | 'ethPriceUsd'
type CountKey = 'newsVolume'

export type HypothesisVerdict = 'supported' | 'mixed' | 'inconclusive' | 'rejected'

export type MetricSnapshot = {
  before: number | null
  eventDay: number | null
  after: number | null
  eventVsBeforePct: number | null
  afterVsBeforePct: number | null
}

export type EventAnalysisSummary = {
  eventDayRow: EventWindow | null
  whale: MetricSnapshot
  inflow: MetricSnapshot
  outflow: MetricSnapshot
  ethPrice: MetricSnapshot
  newsVolume: MetricSnapshot
  peakWhaleVolume: number
  peakInflow: number
  peakOutflow: number
  peakNewsVolume: number
}

export type HypothesisCard = {
  id: string
  badge: string
  title: string
  hypothesis: string
  validation: string
  conclusion: string
  verdict: HypothesisVerdict
}

export type CategoryComparisonDatum = {
  label: string
  whaleChangePct: number
  inflowChangePct: number
  outflowChangePct: number
  priceChangePct: number
}

export type IndexedWindowDatum = {
  dayOffset: number
  date: string
  whaleVolumeUsdNumber: number | null
  cexInflowUsdNumber: number | null
  cexOutflowUsdNumber: number | null
  ethPriceUsdNumber: number | null
  fearGreedValueNumber: number | null
  newsVolumeNumber: number
  whaleIndex: number | null
  inflowIndex: number | null
  outflowIndex: number | null
  ethPriceIndex: number | null
  exchangeNetflowUsd: number | null
}

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function average(values: Array<number | null>): number | null {
  const defined = values.filter((value): value is number => value !== null)
  if (defined.length === 0) return null
  return defined.reduce((sum, value) => sum + value, 0) / defined.length
}

function percentChange(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null || baseline === 0) return null
  return ((current - baseline) / baseline) * 100
}

function indexValue(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null || baseline === 0) return null
  return (current / baseline) * 100
}

function buildMetricSnapshot(rows: EventWindow[], key: MetricKey): MetricSnapshot {
  const beforeRows = rows.filter((row) => row.dayOffset >= -7 && row.dayOffset <= -1)
  const afterRows = rows.filter((row) => row.dayOffset >= 1 && row.dayOffset <= 7)
  const eventDayRow = rows.find((row) => row.dayOffset === 0) ?? null

  const before = average(beforeRows.map((row) => toNumber(row[key])))
  const eventDay = toNumber(eventDayRow?.[key] ?? null)
  const after = average(afterRows.map((row) => toNumber(row[key])))

  return {
    before,
    eventDay,
    after,
    eventVsBeforePct: percentChange(eventDay, before),
    afterVsBeforePct: percentChange(after, before)
  }
}

function peakMetric(rows: EventWindow[], key: 'whaleVolumeUsd' | 'cexInflowUsd' | 'cexOutflowUsd'): number {
  return rows.reduce((peak, row) => Math.max(peak, toNumber(row[key]) ?? 0), 0)
}

function buildCountSnapshot(rows: EventWindow[], key: CountKey): MetricSnapshot {
  const beforeRows = rows.filter((row) => row.dayOffset >= -7 && row.dayOffset <= -1)
  const afterRows = rows.filter((row) => row.dayOffset >= 1 && row.dayOffset <= 7)
  const eventDayRow = rows.find((row) => row.dayOffset === 0) ?? null

  const before = average(beforeRows.map((row) => row[key]))
  const eventDay = eventDayRow?.[key] ?? null
  const after = average(afterRows.map((row) => row[key]))

  return {
    before,
    eventDay,
    after,
    eventVsBeforePct: percentChange(eventDay, before),
    afterVsBeforePct: percentChange(after, before)
  }
}

export function analyzeEventWindow(rows: EventWindow[]): EventAnalysisSummary {
  return {
    eventDayRow: rows.find((row) => row.dayOffset === 0) ?? null,
    whale: buildMetricSnapshot(rows, 'whaleVolumeUsd'),
    inflow: buildMetricSnapshot(rows, 'cexInflowUsd'),
    outflow: buildMetricSnapshot(rows, 'cexOutflowUsd'),
    ethPrice: buildMetricSnapshot(rows, 'ethPriceUsd'),
    newsVolume: buildCountSnapshot(rows, 'newsVolume'),
    peakWhaleVolume: peakMetric(rows, 'whaleVolumeUsd'),
    peakInflow: peakMetric(rows, 'cexInflowUsd'),
    peakOutflow: peakMetric(rows, 'cexOutflowUsd'),
    peakNewsVolume: rows.reduce((peak, row) => Math.max(peak, row.newsVolume), 0)
  }
}

export function buildIndexedWindow(rows: EventWindow[]): IndexedWindowDatum[] {
  const beforeRows = rows.filter((row) => row.dayOffset >= -7 && row.dayOffset <= -1)

  const whaleBaseline = average(beforeRows.map((row) => toNumber(row.whaleVolumeUsd)))
  const inflowBaseline = average(beforeRows.map((row) => toNumber(row.cexInflowUsd)))
  const outflowBaseline = average(beforeRows.map((row) => toNumber(row.cexOutflowUsd)))
  const priceBaseline = average(beforeRows.map((row) => toNumber(row.ethPriceUsd)))

  return rows.map((row) => {
    const whaleVolumeUsdNumber = toNumber(row.whaleVolumeUsd)
    const cexInflowUsdNumber = toNumber(row.cexInflowUsd)
    const cexOutflowUsdNumber = toNumber(row.cexOutflowUsd)
    const ethPriceUsdNumber = toNumber(row.ethPriceUsd)

    return {
      dayOffset: row.dayOffset,
      date: row.date,
      whaleVolumeUsdNumber,
      cexInflowUsdNumber,
      cexOutflowUsdNumber,
      ethPriceUsdNumber,
      fearGreedValueNumber: row.fearGreedValue,
      newsVolumeNumber: row.newsVolume,
      whaleIndex: indexValue(whaleVolumeUsdNumber, whaleBaseline),
      inflowIndex: indexValue(cexInflowUsdNumber, inflowBaseline),
      outflowIndex: indexValue(cexOutflowUsdNumber, outflowBaseline),
      ethPriceIndex: indexValue(ethPriceUsdNumber, priceBaseline),
      exchangeNetflowUsd:
        cexInflowUsdNumber === null || cexOutflowUsdNumber === null
          ? null
          : cexInflowUsdNumber - cexOutflowUsdNumber
    }
  })
}

export function classifyVerdict(value: number | null, direction: 'increase' | 'decrease'): HypothesisVerdict {
  if (value === null) return 'inconclusive'
  if (direction === 'increase') {
    if (value >= 20) return 'supported'
    if (value >= 5) return 'mixed'
    if (value > -5) return 'inconclusive'
    return 'rejected'
  }
  if (value <= -10) return 'supported'
  if (value <= -3) return 'mixed'
  if (value < 3) return 'inconclusive'
  return 'rejected'
}

function formatSignedPct(value: number | null): string {
  if (value === null) return '데이터 부족'
  const rounded = value.toFixed(1)
  return `${value > 0 ? '+' : ''}${rounded}%`
}

function verdictLabel(verdict: HypothesisVerdict): string {
  switch (verdict) {
    case 'supported':
      return '지지'
    case 'mixed':
      return '부분 지지'
    case 'rejected':
      return '반대'
    default:
      return '판정 보류'
  }
}

function compareVerdicts(
  left: HypothesisVerdict,
  right: HypothesisVerdict
): HypothesisVerdict {
  if (left === 'rejected' || right === 'rejected') {
    return left === 'rejected' && right === 'rejected' ? 'rejected' : 'mixed'
  }
  if (left === 'supported' && right === 'supported') return 'supported'
  if (left === 'supported' || right === 'supported' || left === 'mixed' || right === 'mixed') {
    return 'mixed'
  }
  if (left === 'inconclusive' && right === 'inconclusive') return 'inconclusive'
  return 'mixed'
}

function compareOutflowVsInflow(
  outflowChangePct: number | null,
  inflowChangePct: number | null
): HypothesisVerdict {
  if (outflowChangePct === null || inflowChangePct === null) return 'inconclusive'
  if (outflowChangePct <= 0) return 'rejected'
  if (outflowChangePct > inflowChangePct) return 'supported'
  if (outflowChangePct === inflowChangePct && outflowChangePct > 0) return 'mixed'
  return 'rejected'
}

export function buildHypothesisCards(event: EventRecord, summary: EventAnalysisSummary): HypothesisCard[] {
  const inflowVerdict = classifyVerdict(summary.inflow.eventVsBeforePct, 'increase')
  const outflowVerdict = classifyVerdict(summary.outflow.eventVsBeforePct, 'increase')
  const reallocationVerdict = compareVerdicts(inflowVerdict, outflowVerdict)
  const priceDirection =
    event.category === 'rally' || event.category === 'mania' ? 'increase' : 'decrease'
  const priceVerdict = classifyVerdict(summary.ethPrice.afterVsBeforePct, priceDirection)
  const rallyVerdict = compareOutflowVsInflow(
    summary.outflow.eventVsBeforePct,
    summary.inflow.eventVsBeforePct
  )

  const priceCard: HypothesisCard = {
    id: 'price',
    badge: `가설 4 · ${verdictLabel(priceVerdict)}`,
    title: '사건 뒤 7일 가격 흐름이 시장 해석을 완성한다',
    hypothesis:
      priceDirection === 'increase'
        ? '호재라면 사건 뒤 7일 평균 가격이 사건 전보다 높아져야 한다.'
        : '위기나 규제 충격이라면 사건 뒤 7일 평균 가격이 사건 전보다 낮아져야 한다.',
    validation: `사건 후 7일 ETH 평균 가격은 사건 전 대비 ${formatSignedPct(summary.ethPrice.afterVsBeforePct)}였다.`,
    conclusion:
      priceVerdict === 'supported'
        ? '가격 반응까지 맞아떨어져 사건 해석이 비교적 선명하다.'
        : priceVerdict === 'mixed'
          ? '가격이 기대 방향으로 움직였지만 강도는 제한적이다.'
          : priceVerdict === 'rejected'
            ? '가격이 반대로 움직여, 사건 해석을 다시 볼 필요가 있다.'
            : '가격 데이터가 부족해 결론을 서두르기 어렵다.',
    verdict: priceVerdict
  }

  if (event.category === 'rally') {
    return [
      {
        id: 'outflow-advantage',
        badge: `가설 2 · ${verdictLabel(rallyVerdict)}`,
        title: '호재 이벤트에서는 출금 반응이 입금보다 더 강하다',
        hypothesis: '호재라면 거래소 안으로 넣는 흐름보다 밖으로 빼는 흐름이 더 강하게 반응해야 한다.',
        validation: `사건일 거래소 출금 변화율은 ${formatSignedPct(summary.outflow.eventVsBeforePct)}, 입금 변화율은 ${formatSignedPct(summary.inflow.eventVsBeforePct)}였다.`,
        conclusion:
          rallyVerdict === 'supported'
            ? '출금이 입금보다 우세해 호재형 반응 가설을 지지한다.'
            : rallyVerdict === 'mixed'
              ? '출금 우위는 보이지만 차이가 크진 않아 부분 지지로 본다.'
              : rallyVerdict === 'rejected'
                ? '입금 반응이 더 강하거나 비슷해, 호재형 출금 우위 가설과는 거리가 있다.'
                : '입금/출금 데이터가 부족해 이 가설은 보류한다.',
        verdict: rallyVerdict
      },
      priceCard
    ]
  }

  if (!['crash', 'crisis'].includes(event.category)) {
    return [priceCard]
  }

  return [
    {
      id: 'inflow',
      badge: `가설 1 · ${verdictLabel(inflowVerdict)}`,
      title: '사건일에는 거래소 입금이 평소보다 커진다',
      hypothesis: `${event.nameKo} 같은 사건이 터질 때는 거래소 유입이 먼저 커지며, 매도 압력 또는 긴급 대응 신호가 나타난다.`,
      validation: `사건 전 7일 평균 대비 사건일 거래소 입금은 ${formatSignedPct(summary.inflow.eventVsBeforePct)}였다.`,
      conclusion:
        inflowVerdict === 'supported'
          ? '이 사건은 거래소 입금 급증 가설을 분명하게 뒷받침한다.'
          : inflowVerdict === 'mixed'
            ? '입금은 늘었지만 폭발적이라고 보긴 어려워 부분 지지로 본다.'
            : inflowVerdict === 'rejected'
              ? '사건일 입금이 오히려 약해져, 이 가설과는 반대 흐름이다.'
              : '입금 데이터가 충분하지 않아 판단을 보류한다.',
      verdict: inflowVerdict
    },
    {
      id: 'reallocation',
      badge: `가설 3 · ${verdictLabel(reallocationVerdict)}`,
      title: '큰 위기일수록 입금과 출금이 함께 커지며 자금 재배치가 나타난다',
      hypothesis: '사건일에 거래소 입금과 출금이 동시에 확대되면, 단순 매도보다 더 큰 자금 재배치가 일어난 것으로 볼 수 있다.',
      validation: `사건일 거래소 입금은 전 7일 평균 대비 ${formatSignedPct(summary.inflow.eventVsBeforePct)}, 거래소 출금은 ${formatSignedPct(summary.outflow.eventVsBeforePct)} 변했다.`,
      conclusion:
        reallocationVerdict === 'supported'
          ? '입금과 출금이 함께 커져 자금 재배치 가설을 강하게 지지한다.'
          : reallocationVerdict === 'mixed'
            ? '방향성은 보이지만 재배치 강도는 중간 수준으로 읽힌다.'
            : reallocationVerdict === 'rejected'
              ? '입금과 출금이 함께 커지지 않아, 사건일 자금 재배치가 뚜렷하지 않았다.'
              : '입금 또는 출금 데이터가 부족해 이 가설은 보류한다.',
      verdict: reallocationVerdict
    },
    priceCard
  ]
}

type ComparisonAccumulator = {
  whaleChangePct: number[]
  inflowChangePct: number[]
  outflowChangePct: number[]
  priceChangePct: number[]
}

function getAccumulator(map: Map<string, ComparisonAccumulator>, key: string): ComparisonAccumulator {
  const existing = map.get(key)
  if (existing) return existing
  const created: ComparisonAccumulator = {
    whaleChangePct: [],
    inflowChangePct: [],
    outflowChangePct: [],
    priceChangePct: []
  }
  map.set(key, created)
  return created
}

function pushIfNumber(values: number[], value: number | null) {
  if (value !== null) values.push(value)
}

function averageOrZero(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function toComparisonDatum(label: string, bucket: ComparisonAccumulator): CategoryComparisonDatum {
  return {
    label,
    whaleChangePct: averageOrZero(bucket.whaleChangePct),
    inflowChangePct: averageOrZero(bucket.inflowChangePct),
    outflowChangePct: averageOrZero(bucket.outflowChangePct),
    priceChangePct: averageOrZero(bucket.priceChangePct)
  }
}

function buildComparisonData(
  responses: EventWindowResponse[],
  selectKey: (response: EventWindowResponse) => string,
  labels: Record<string, string>
): CategoryComparisonDatum[] {
  const grouped = new Map<string, ComparisonAccumulator>()

  responses.forEach((response) => {
    const summary = analyzeEventWindow(response.window)
    const bucket = getAccumulator(grouped, selectKey(response))
    pushIfNumber(bucket.whaleChangePct, summary.whale.eventVsBeforePct)
    pushIfNumber(bucket.inflowChangePct, summary.inflow.eventVsBeforePct)
    pushIfNumber(bucket.outflowChangePct, summary.outflow.eventVsBeforePct)
    pushIfNumber(bucket.priceChangePct, summary.ethPrice.afterVsBeforePct)
  })

  return Array.from(grouped.entries()).map(([category, bucket]) =>
    toComparisonDatum(labels[category] ?? category, bucket)
  )
}

export function buildCategoryComparisonData(responses: EventWindowResponse[]): CategoryComparisonDatum[] {
  return buildComparisonData(responses, (response) => response.event.category, {
    crash: '폭락',
    crisis: '위기',
    rally: '호재',
    mania: '과열',
    regulation: '규제'
  })
}

export function buildRegionComparisonData(responses: EventWindowResponse[]): CategoryComparisonDatum[] {
  return buildComparisonData(responses, (response) => response.event.region, {
    global: '글로벌',
    kr: '한국'
  })
}
