import { Fragment } from 'react'
import type { z } from 'zod'

import { SectionCard } from '../../components/SectionCard'
import { useCategoryWindows } from '../../api/endpoints'
import type { eventSchema } from '../../api/schemas'
import {
  buildCategoryComparisonData,
  buildRegionComparisonData,
  type CategoryComparisonDatum
} from '../../lib/eventAnalysis'

type EventRecord = z.infer<typeof eventSchema>

const comparisonHypotheses = [
  {
    id: 'h1',
    title: '가설 1',
    summary: '위기·폭락 이벤트는 사건일 거래소 입금이 가장 크게 튄다.'
  },
  {
    id: 'h2',
    title: '가설 2',
    summary: '호재 이벤트는 거래소 출금이 입금보다 강하게 반응한다.'
  },
  {
    id: 'h3',
    title: '가설 3',
    summary: '위기·폭락 구간은 입금과 출금이 함께 커지며 재배치를 보인다.'
  },
  {
    id: 'h4',
    title: '가설 4',
    summary: '사건 후 7일 가격 변화는 시장 해석을 보여준다.'
  },
  {
    id: 'h5',
    title: '가설 5',
    summary: '한국 이벤트는 글로벌 이벤트보다 변화폭이 완만하다.'
  }
]

const comparisonColumns = [
  { key: 'inflowChangePct', label: '입금', helper: '사건일' },
  { key: 'outflowChangePct', label: '출금', helper: '사건일' },
  { key: 'whaleChangePct', label: '고래 송금', helper: '사건일' },
  { key: 'priceChangePct', label: 'ETH 가격', helper: '사건 후 7일' }
] as const

function formatSignedPct(value: number): string {
  const rounded = value.toFixed(1)
  return `${value > 0 ? '+' : ''}${rounded}%`
}

function heatColor(value: number): string {
  if (value >= 100) return 'bg-emerald-400/30 text-emerald-50 border-emerald-300/40'
  if (value >= 30) return 'bg-emerald-400/18 text-emerald-50 border-emerald-300/30'
  if (value >= 5) return 'bg-emerald-400/8 text-emerald-50 border-emerald-300/20'
  if (value <= -30) return 'bg-rose-400/22 text-rose-50 border-rose-300/35'
  if (value <= -5) return 'bg-rose-400/10 text-rose-50 border-rose-300/20'
  return 'bg-white/5 text-brand-text border-white/10'
}

function strongestMetric(
  data: CategoryComparisonDatum[],
  key: keyof CategoryComparisonDatum
): CategoryComparisonDatum | null {
  if (data.length === 0) return null
  return [...data].sort((left, right) => Number(right[key]) - Number(left[key]))[0] ?? null
}

function ComparisonHeatmap({
  title,
  description,
  data
}: {
  title: string
  description: string
  data: CategoryComparisonDatum[]
}) {
  return (
    <div className="border border-brand-border bg-[#10141d] p-4">
      <h3 className="text-lg font-body text-brand-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">{description}</p>
      <div className="mt-4 space-y-3 md:hidden">
        <div className="rounded-none border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs leading-relaxed text-cyan-100 font-body">
          모바일에서는 표 대신 카드형 비교로 보여준다. 각 카드는 한 구간의 입금·출금·고래 송금·가격 반응을 순서대로 읽게 구성했다.
        </div>
        {data.map((row) => (
          <article key={`${row.label}-mobile`} className="border border-brand-border bg-brand-surface p-4">
            <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{row.label}</div>
            <div className="mt-3 grid gap-2">
              {comparisonColumns.map((column) => {
                const value = row[column.key]
                return (
                  <div
                    key={`${row.label}-mobile-${column.key}`}
                    className={`border px-3 py-3 ${heatColor(value)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-body">{column.label}</div>
                        <div className="mt-1 text-xs font-body opacity-70">{column.helper}</div>
                      </div>
                      <div className="text-lg font-body">{formatSignedPct(value)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 hidden md:block">
        <div className="mb-3 rounded-none border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs leading-relaxed text-cyan-100 font-body">
          넓은 화면에서는 같은 축의 표로 비교한다. 화면이 좁으면 표 전체가 보이도록 가로 스크롤이 활성화된다.
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
          <div className="grid grid-cols-[160px_repeat(4,minmax(0,1fr))] gap-2">
            <div className="border border-brand-border bg-brand-surface px-3 py-3 font-display text-[11px] uppercase tracking-[1px] text-brand-muted">
              구간
            </div>
            {comparisonColumns.map((column) => (
              <div
                key={column.key}
                className="border border-brand-border bg-brand-surface px-3 py-3"
              >
                <div className="font-display text-[11px] uppercase tracking-[1px] text-brand-muted">
                  {column.label}
                </div>
                <div className="mt-1 text-xs text-brand-muted font-body">{column.helper}</div>
              </div>
            ))}
            {data.map((row) => (
              <Fragment key={row.label}>
                <div
                  className="border border-brand-border bg-brand-surface px-3 py-3 text-sm font-body text-brand-text"
                >
                  {row.label}
                </div>
                {comparisonColumns.map((column) => {
                  const value = row[column.key]
                  return (
                    <div
                      key={`${row.label}-${column.key}`}
                      className={`border px-3 py-3 ${heatColor(value)}`}
                    >
                      <div className="text-lg font-body">{formatSignedPct(value)}</div>
                      <div className="mt-1 text-xs font-body opacity-70">
                        전 7일 평균 대비
                      </div>
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export function CategoryCompareView({ events }: { events: EventRecord[] }) {
  const eventIds = events.map((event) => event.id)
  const queries = useCategoryWindows(eventIds)
  const hasLoading = queries.some((query) => query.isLoading)
  const hasError = queries.some((query) => query.isError)
  const responses = queries
    .map((query) => query.data)
    .filter((response): response is NonNullable<(typeof queries)[number]['data']> => Boolean(response))

  const categoryData = buildCategoryComparisonData(responses)
  const regionData = buildRegionComparisonData(responses)
  const strongestInflow = strongestMetric(categoryData, 'inflowChangePct')
  const strongestOutflow = strongestMetric(categoryData, 'outflowChangePct')
  const strongestPrice = strongestMetric(categoryData, 'priceChangePct')

  return (
    <SectionCard title="가설 검증 비교실" eyebrow="이벤트 비교">
      <p className="mb-6 text-base text-brand-muted font-body leading-relaxed">
        이 화면은 막대 수를 늘리기보다, 어떤 구간이 어떤 지표에서 강하게 반응했는지를 한 번에 읽도록 구성했다.
        각 셀의 값은 <span className="font-semibold text-brand-text">사건 전 7일 평균 대비 변화율</span>이다.
      </p>

      {hasLoading ? (
        <div className="mb-6 border border-brand-border bg-brand-surface p-4 text-sm leading-relaxed text-brand-muted font-body">
          비교용 이벤트 윈도우를 모으는 중이다. 아직 일부 사건만 반영됐을 수 있다.
        </div>
      ) : null}

      {hasError ? (
        <div className="mb-6 border border-red-300/40 bg-red-300/10 p-4 text-sm leading-relaxed text-red-100 font-body">
          일부 비교 데이터가 비어 있어 표의 수치는 부분 집계일 수 있다.
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {comparisonHypotheses.map((item) => (
          <article key={item.id} className="border border-brand-border bg-brand-surface p-4">
            <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{item.title}</div>
            <p className="mt-2 text-base leading-relaxed text-brand-text font-body">{item.summary}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">가장 강한 입금 반응</div>
          <div className="mt-3 text-[22px] font-body text-brand-text">{strongestInflow?.label ?? '데이터 없음'}</div>
          <p className="mt-2 text-sm font-body text-brand-muted">
            {strongestInflow ? `${formatSignedPct(strongestInflow.inflowChangePct)}로 가장 크게 튄 구간` : '비교 데이터 부족'}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">가장 강한 출금 반응</div>
          <div className="mt-3 text-[22px] font-body text-brand-text">{strongestOutflow?.label ?? '데이터 없음'}</div>
          <p className="mt-2 text-sm font-body text-brand-muted">
            {strongestOutflow ? `${formatSignedPct(strongestOutflow.outflowChangePct)}로 가장 크게 튄 구간` : '비교 데이터 부족'}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">가장 강한 가격 해석</div>
          <div className="mt-3 text-[22px] font-body text-brand-text">{strongestPrice?.label ?? '데이터 없음'}</div>
          <p className="mt-2 text-sm font-body text-brand-muted">
            {strongestPrice ? `사건 후 7일 ${formatSignedPct(strongestPrice.priceChangePct)}` : '비교 데이터 부족'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-2">
        <ComparisonHeatmap
          title="카테고리별 반응 히트맵"
          description="폭락·위기·호재·과열·규제 이벤트를 평균냈을 때, 사건일과 사건 후 7일에 무엇이 가장 크게 반응했는지 본다."
          data={categoryData}
        />
        <ComparisonHeatmap
          title="지역별 반응 히트맵"
          description="글로벌과 한국 이벤트를 같은 축으로 비교해, 어느 쪽이 더 거칠게 흔들리는지 확인한다."
          data={regionData}
        />
      </div>

      <div className="mt-4 border border-brand-border bg-brand-surface p-4">
        <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">읽는 법</div>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">
          초록에 가까울수록 기준선보다 더 크게 상승한 반응이고, 붉을수록 기준선보다 약하거나 반대 방향으로 움직인 반응이다.
          같은 행을 가로로 읽으면 한 이벤트 성격에서 무엇이 먼저 반응했는지, 같은 열을 세로로 읽으면 어떤 구간이 특정 지표에 예민한지 보인다.
        </p>
      </div>
    </SectionCard>
  )
}
