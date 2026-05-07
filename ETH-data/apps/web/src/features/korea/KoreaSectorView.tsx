import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { z } from 'zod'

import { SectionCard } from '../../components/SectionCard'
import { useCategoryWindows } from '../../api/endpoints'
import type { eventSchema } from '../../api/schemas'
import { analyzeEventWindow, buildIndexedWindow } from '../../lib/eventAnalysis'

type EventRecord = z.infer<typeof eventSchema>

function formatSignedPct(value: number | null): string {
  if (value === null) return '데이터 없음'
  const rounded = value.toFixed(1)
  return `${value > 0 ? '+' : ''}${rounded}%`
}

function sharedIndexDomain(values: Array<number | null>): [number, number] {
  const defined = values.filter((value): value is number => value !== null)
  if (defined.length === 0) return [50, 150]
  const min = Math.min(...defined, 100)
  const max = Math.max(...defined, 100)
  return [Math.max(0, Math.floor(min / 25) * 25), Math.ceil(max / 25) * 25]
}

export function KoreaSectorView({
  events,
  onSelectEvent,
  buildHref
}: {
  events: EventRecord[]
  onSelectEvent: (eventId: string) => void
  buildHref: (eventId: string) => string
}) {
  const koreaEvents = events.filter((event) => event.region === 'kr')
  const queries = useCategoryWindows(koreaEvents.map((event) => event.id))
  const queryMap = new Map(
    queries
      .map((query) => query.data)
      .filter((response): response is NonNullable<(typeof queries)[number]['data']> => Boolean(response))
      .map((response) => [response.event.id, response])
  )
  const koreaCards = koreaEvents.map((event) => {
    const response = queryMap.get(event.id)
    const chartData = response ? buildIndexedWindow(response.window) : []
    const summary = response ? analyzeEventWindow(response.window) : null
    const hasFlowChartData = chartData.some(
      (row) => row.inflowIndex !== null || row.outflowIndex !== null
    )

    return {
      event,
      response,
      chartData,
      summary,
      hasFlowChartData
    }
  })
  const sharedDomain = sharedIndexDomain(
    koreaCards.flatMap((card) =>
      card.chartData.flatMap((row) => [row.inflowIndex, row.outflowIndex])
    )
  )

  return (
    <SectionCard title="한국 섹터" eyebrow="국내 사건 보기">
      <p className="mb-6 text-base leading-relaxed text-brand-muted font-body">
        한국 이벤트는 카드 목록보다 <span className="font-semibold text-brand-text">같은 축의 작은 그래프</span>로 보는 편이 패턴 비교에 유리하다.
        각 패널은 사건 전 7일 평균을 100으로 두고, 사건일 전후 거래소 입금과 출금이 얼마나 흔들렸는지 보여준다.
      </p>
      <div className="mb-6 rounded-none border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm leading-relaxed text-cyan-100 font-body">
        모든 미니차트는 <span className="font-semibold">같은 세로축</span>을 사용한다. 가운데 기준선 100은 사건 전 7일 평균이고,
        데이터가 없는 이벤트는 축만 남기지 않고 결측 상태를 직접 표시한다.
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {koreaCards.map(({ event, response, chartData, summary, hasFlowChartData }) => {
          return (
            <a
              key={event.id}
              href={buildHref(event.id)}
              className="border border-brand-border bg-brand-surface p-[24px] text-left transition-colors hover:border-brand-border-strong hover:bg-brand-surface-hover"
              onClick={(clickEvent) => {
                clickEvent.preventDefault()
                onSelectEvent(event.id)
              }}
            >
              <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">
                {event.eventDate}
              </div>
              <div className="mt-3 text-[22px] font-body text-brand-text">🇰🇷 {event.nameKo}</div>
              <p className="mt-2 text-sm text-brand-muted font-body leading-relaxed">
                {event.description}
              </p>

              <div className="mt-4 h-[190px] w-full border border-brand-border bg-[#111319] p-3">
                {response && hasFlowChartData ? (
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                      <ReferenceLine
                        y={100}
                        stroke="rgba(255,255,255,0.22)"
                        strokeDasharray="4 4"
                        label={{
                          value: '100',
                          position: 'insideTopLeft',
                          fill: 'rgba(255,255,255,0.75)',
                          fontSize: 10,
                          fontFamily: 'var(--font-body)'
                        }}
                      />
                      <ReferenceLine x={0} stroke="rgba(250, 204, 21, 0.9)" strokeWidth={2} />
                      <XAxis
                        dataKey="dayOffset"
                        tick={{ fill: 'rgba(255,255,255,0.72)', fontSize: 11, fontFamily: 'var(--font-body)' }}
                        stroke="rgba(255,255,255,0.18)"
                      />
                      <YAxis
                        width={28}
                        domain={sharedDomain}
                        ticks={[sharedDomain[0], 100, sharedDomain[1]]}
                        tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'var(--font-body)' }}
                        stroke="rgba(255,255,255,0.18)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0b0d12',
                          border: '1px solid rgba(255, 255, 255, 0.24)',
                          borderRadius: 0,
                          fontFamily: 'var(--font-body)',
                          color: '#fff'
                        }}
                        formatter={(value, name) =>
                          value == null ? '데이터 없음' : [`${Number(value).toFixed(0)}`, name]
                        }
                        labelFormatter={(value) => `사건일 ${value > 0 ? '+' : ''}${value}일`}
                      />
                      <Line
                        type="monotone"
                        dataKey="inflowIndex"
                        stroke="#f59e0b"
                        strokeWidth={2.2}
                        dot={false}
                        name="거래소 입금"
                      />
                      <Line
                        type="monotone"
                        dataKey="outflowIndex"
                        stroke="#10b981"
                        strokeWidth={2.2}
                        dot={false}
                        name="거래소 출금"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">
                      차트 데이터 없음
                    </div>
                    <p className="mt-2 max-w-[240px] text-sm leading-relaxed font-body text-brand-muted">
                      이 사건 구간에는 집계 가능한 거래소 입금/출금 원천 데이터가 없어 추세선을 그리지 않았다.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="border border-brand-border bg-[#111319] p-3">
                  <div className="font-display text-[11px] uppercase tracking-[1px] text-brand-muted">사건일 입금</div>
                  <div className="mt-2 text-base font-body text-brand-text">
                    {summary ? formatSignedPct(summary.inflow.eventVsBeforePct) : '데이터 없음'}
                  </div>
                </div>
                <div className="border border-brand-border bg-[#111319] p-3">
                  <div className="font-display text-[11px] uppercase tracking-[1px] text-brand-muted">사건일 출금</div>
                  <div className="mt-2 text-base font-body text-brand-text">
                    {summary ? formatSignedPct(summary.outflow.eventVsBeforePct) : '데이터 없음'}
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </SectionCard>
  )
}
