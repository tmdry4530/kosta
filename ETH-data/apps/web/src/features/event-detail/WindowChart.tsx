import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { z } from 'zod'

import type { eventWindowSchema } from '../../api/schemas'
import { buildIndexedWindow } from '../../lib/eventAnalysis'
import { formatCompactNumber } from '../../lib/format'

type EventWindow = z.infer<typeof eventWindowSchema>

function activityDomain(values: Array<number | null>): [number, number] {
  const defined = values.filter((value): value is number => value !== null)
  if (defined.length === 0) return [0, 200]
  const min = Math.min(...defined, 100)
  const max = Math.max(...defined, 100)
  return [Math.max(0, Math.floor(min / 25) * 25), Math.ceil(max / 25) * 25]
}

function activityTicks(domain: [number, number]): number[] {
  return Array.from(new Set([domain[0], 100, domain[1]])).sort((left, right) => left - right)
}

function netflowDomain(values: Array<number | null>): [number, number] {
  const defined = values.filter((value): value is number => value !== null)
  if (defined.length === 0) return [-1, 1]
  const peak = Math.max(...defined.map((value) => Math.abs(value)), 1)
  return [-peak, peak]
}

export function WindowChart({ rows }: { rows: EventWindow[] }) {
  const data = buildIndexedWindow(rows)

  const hasWhaleData = data.some((row) => row.whaleIndex !== null)
  const hasInflowData = data.some((row) => row.inflowIndex !== null)
  const hasOutflowData = data.some((row) => row.outflowIndex !== null)
  const hasNetflowData = data.some((row) => row.exchangeNetflowUsd !== null)
  const hasPriceData = data.some((row) => row.ethPriceIndex !== null)
  const hasFearGreedData = data.some((row) => row.fearGreedValueNumber !== null)
  const hasNewsVolumeData = data.some((row) => row.newsVolumeNumber > 0)

  const activityRange = activityDomain(
    data.flatMap((row) => [row.whaleIndex, row.inflowIndex, row.outflowIndex])
  )
  const netflowRange = netflowDomain(data.map((row) => row.exchangeNetflowUsd))
  const activityTickValues = activityTicks(activityRange)

  return (
    <div className="space-y-4">
      <div className="border border-brand-border bg-[#111319] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-body">
          <span className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-1 text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            기준선 100 = 사건 전 7일 평균
          </span>
          {hasWhaleData ? (
            <span className="inline-flex items-center gap-2 border border-sky-300/40 bg-sky-300/10 px-3 py-1 text-sky-100">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
              고래 송금
            </span>
          ) : null}
          {hasInflowData ? (
            <span className="inline-flex items-center gap-2 border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-amber-100">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              거래소 입금
            </span>
          ) : null}
          {hasOutflowData ? (
            <span className="inline-flex items-center gap-2 border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-emerald-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              거래소 출금
            </span>
          ) : null}
        </div>
        <div className="mb-4 border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">
            핵심 질문
          </div>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">
            사건일 전후에 어떤 지표가 평소보다 더 크게 튀었는지 먼저 본다. 100보다 높으면 사건 전 7일 평균보다 강한 반응, 100보다 낮으면 평소보다 약한 반응이다.
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="h-[260px] min-w-[680px] w-full">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3 3" />
                <ReferenceLine
                  y={100}
                  stroke="rgba(255,255,255,0.25)"
                  strokeDasharray="4 4"
                  label={{
                    value: '100 기준선',
                    position: 'insideBottomLeft',
                    fill: 'rgba(255,255,255,0.7)',
                    fontSize: 11,
                    fontFamily: 'var(--font-body)'
                  }}
                />
                <ReferenceLine
                  x={0}
                  stroke="rgba(250, 204, 21, 0.9)"
                  strokeWidth={2}
                  label={{
                    value: '이벤트일',
                    position: 'insideTopRight',
                    fill: '#fde68a',
                    fontSize: 11,
                    fontFamily: 'var(--font-body)'
                  }}
                />
                <XAxis
                  dataKey="dayOffset"
                  tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
                  stroke="rgba(255, 255, 255, 0.28)"
                />
                <YAxis
                  domain={activityRange}
                  ticks={activityTickValues}
                  tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
                  tickFormatter={(value) => `${Number(value).toFixed(0)}`}
                  stroke="rgba(255, 255, 255, 0.28)"
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
                {hasWhaleData ? (
                  <Line
                    type="monotone"
                    dataKey="whaleIndex"
                    stroke="#38bdf8"
                    strokeWidth={2.6}
                    dot={false}
                    name="고래 송금"
                  />
                ) : null}
                {hasInflowData ? (
                  <Line
                    type="monotone"
                    dataKey="inflowIndex"
                    stroke="#f59e0b"
                    strokeWidth={2.2}
                    dot={false}
                    name="거래소 입금"
                  />
                ) : null}
                {hasOutflowData ? (
                  <Line
                    type="monotone"
                    dataKey="outflowIndex"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    dot={false}
                    name="거래소 출금"
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-brand-border bg-[#111319] p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">
            거래소 순유입
          </div>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">
            0 위로 올라가면 거래소 안으로 더 많이 들어간 날이고, 0 아래로 내려가면 거래소 밖으로 더 많이 빠져나간 날이다.
          </p>
          <div className="mt-4 overflow-x-auto">
            <div className="h-[220px] min-w-[680px] w-full">
              <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 16 }}>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                  <ReferenceLine x={0} stroke="rgba(250, 204, 21, 0.9)" strokeWidth={2} />
                  <XAxis
                    dataKey="dayOffset"
                    tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
                    stroke="rgba(255, 255, 255, 0.28)"
                  />
                  <YAxis
                    domain={netflowRange}
                    width={76}
                    tickMargin={8}
                    tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)', fontSize: 12 }}
                    tickFormatter={(value) => `$${formatCompactNumber(Number(value))}`}
                    stroke="rgba(255, 255, 255, 0.28)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0d12',
                      border: '1px solid rgba(255, 255, 255, 0.24)',
                      borderRadius: 0,
                      fontFamily: 'var(--font-body)',
                      color: '#fff'
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    formatter={(value) =>
                      value == null ? '데이터 없음' : `$${formatCompactNumber(Number(value))}`
                    }
                    labelFormatter={(value) => `사건일 ${value > 0 ? '+' : ''}${value}일`}
                  />
                  {hasNetflowData ? (
                    <Bar
                      dataKey="exchangeNetflowUsd"
                      fill="rgba(255,255,255,0.7)"
                      name="순유입"
                      barSize={22}
                      activeBar={{ fill: 'rgba(255,255,255,0.78)', stroke: 'rgba(255,255,255,0.16)', strokeWidth: 1 }}
                    />
                  ) : null}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="border border-brand-border bg-[#111319] p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">
            시장 컨텍스트
          </div>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">
            가격, 심리, 뉴스는 보조 정보로 분리해서 본다. 메인 해석은 위 자금 흐름 그래프에서 한다.
          </p>
          <div className="mt-4 overflow-x-auto">
            <div className="h-[220px] min-w-[520px] w-full">
              <ResponsiveContainer>
                <ComposedChart data={data}>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3 3" />
                  <ReferenceLine
                    x={0}
                    yAxisId="price"
                    stroke="rgba(250, 204, 21, 0.9)"
                    strokeWidth={2}
                  />
                  <XAxis
                    dataKey="dayOffset"
                    tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
                    stroke="rgba(255, 255, 255, 0.28)"
                  />
                  <YAxis
                    yAxisId="price"
                    tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
                    tickFormatter={(value) => `${Number(value).toFixed(0)}`}
                    stroke="rgba(255, 255, 255, 0.28)"
                  />
                  {hasFearGreedData ? (
                    <YAxis
                      yAxisId="fg"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
                      stroke="rgba(255, 255, 255, 0.28)"
                    />
                  ) : null}
                  {hasNewsVolumeData ? <YAxis yAxisId="news" orientation="right" hide /> : null}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0d12',
                      border: '1px solid rgba(255, 255, 255, 0.24)',
                      borderRadius: 0,
                      fontFamily: 'var(--font-body)',
                      color: '#fff'
                    }}
                    formatter={(value, name) =>
                      value == null
                        ? '데이터 없음'
                        : name === '뉴스 볼륨'
                          ? `${value}건`
                          : name === '공포·탐욕 지수'
                            ? `${value}`
                            : `${Number(value).toFixed(0)}`
                    }
                    labelFormatter={(value) => `사건일 ${value > 0 ? '+' : ''}${value}일`}
                  />
                  {hasNewsVolumeData ? (
                    <Bar
                      yAxisId="news"
                      dataKey="newsVolumeNumber"
                      fill="rgba(255,255,255,0.2)"
                      name="뉴스 볼륨"
                      barSize={16}
                    />
                  ) : null}
                  {hasPriceData ? (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ethPriceIndex"
                      stroke="#ffffff"
                      strokeWidth={2.2}
                      dot={false}
                      name="ETH 가격"
                    />
                  ) : null}
                  {hasFearGreedData ? (
                    <Line
                      yAxisId="fg"
                      type="monotone"
                      dataKey="fearGreedValueNumber"
                      stroke="#e879f9"
                      strokeWidth={2.1}
                      dot={false}
                      name="공포·탐욕 지수"
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-body text-brand-muted">
            {hasPriceData ? (
              <span className="border border-white/15 bg-white/5 px-3 py-1 text-white">ETH 가격</span>
            ) : null}
            {hasFearGreedData ? (
              <span className="border border-fuchsia-300/40 bg-fuchsia-300/10 px-3 py-1 text-fuchsia-100">
                공포·탐욕 지수
              </span>
            ) : null}
            {hasNewsVolumeData ? (
              <span className="border border-white/15 bg-white/5 px-3 py-1 text-brand-muted">뉴스 볼륨</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
