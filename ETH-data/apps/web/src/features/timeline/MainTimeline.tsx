import { Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { z } from 'zod'
import { SectionCard } from '../../components/SectionCard'
import { categoryColor, formatCompactNumber } from '../../lib/format'
import { eventWeekLabel, startOfWeek } from '../../lib/timeline'
import type { eventSchema, whaleFlowSchema } from '../../api/schemas'

type EventRecord = z.infer<typeof eventSchema>
type WhaleFlow = z.infer<typeof whaleFlowSchema>

export function MainTimeline({
  events,
  whaleFlows,
  selectedEventId,
  availableYears,
  selectedYear,
  buildHref,
  onSelectYear,
  onSelectEvent
}: {
  events: EventRecord[]
  whaleFlows: WhaleFlow[]
  selectedEventId: string | null
  availableYears: string[]
  selectedYear: string
  buildHref: (eventId: string) => string
  onSelectYear: (year: string) => void
  onSelectEvent: (eventId: string) => void
}) {
  const chartData = whaleFlows.map((row) => ({
    weekStart: row.weekStart,
    totalVolumeUsd: Number(row.totalVolumeUsd)
  }))

  const eventLabel = (event: EventRecord) => `${event.region === 'kr' ? '🇰🇷 ' : ''}${event.nameKo}`
  const eventsWithBuckets = events.map((event) => ({
    ...event,
    weekStart: startOfWeek(event.eventDate)
  }))
  const selectedEvent = eventsWithBuckets.find((event) => event.id === selectedEventId) ?? null

  return (
    <SectionCard
      title="큰 지갑 활동 타임라인"
      eyebrow="메인 타임라인"
    >
      <p className="mb-6 text-base leading-relaxed text-brand-muted font-body">
        먼저 전체 흐름을 보고, 원하는 연도로 사건 범위를 좁힌 다음 하나의 사건을 골라 아래 디테일 패널에서
        전후 7일의 움직임과 뉴스 반응을 확인할 수 있다.
      </p>
      {selectedEvent ? (
        <div className="mb-4 border border-yellow-300/70 bg-yellow-300/12 p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-yellow-200">선택된 사건의 차트 구간</div>
          <p className="mt-2 text-base font-body text-brand-text">
            <span className="font-semibold">{eventLabel(selectedEvent)}</span>은(는) 차트에서{' '}
            <span className="font-semibold text-yellow-100">{eventWeekLabel(selectedEvent.eventDate)}</span> 주간 구간에 표시된다.
          </p>
        </div>
      ) : null}
      <div className="mb-3 text-sm leading-relaxed text-brand-muted font-body">
        모바일에서는 차트를 좌우로 밀어 날짜 축과 이벤트 위치를 더 선명하게 볼 수 있다.
      </div>
      <div className="overflow-x-auto">
        <div className="h-[380px] min-w-[860px] w-full">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
            <XAxis
              dataKey="weekStart"
              minTickGap={54}
              tick={{ fill: 'rgba(255, 255, 255, 0.78)', fontSize: 12, fontFamily: 'var(--font-body)' }}
              stroke="rgba(255, 255, 255, 0.2)"
            />
            <YAxis
              tickFormatter={(value) => formatCompactNumber(Number(value))}
              tick={{ fill: 'rgba(255, 255, 255, 0.78)', fontSize: 12, fontFamily: 'var(--font-body)' }}
              stroke="rgba(255, 255, 255, 0.2)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111319',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 0,
                fontFamily: 'var(--font-body)',
                color: '#fff'
              }}
              formatter={(value: number) => [`$${formatCompactNumber(value)}`, '주간 고래 송금']}
              labelFormatter={(value) => `${value} 주간`}
            />
            {selectedEvent ? (
              <ReferenceArea
                x1={selectedEvent.weekStart}
                x2={selectedEvent.weekStart}
                fill="rgba(250, 204, 21, 0.2)"
                strokeOpacity={0}
              />
            ) : null}
            <Line type="monotone" dataKey="totalVolumeUsd" stroke="#ffffff" strokeWidth={2.4} dot={false} />
            {eventsWithBuckets.map((event) => (
              <ReferenceLine
                key={event.id}
                x={event.weekStart}
                stroke={event.id === selectedEventId ? '#facc15' : categoryColor(event.category)}
                strokeDasharray={event.region === 'kr' ? '2 2' : '5 4'}
                strokeWidth={event.id === selectedEventId ? 3.5 : 1.4}
                label={{
                  value: event.id === selectedEventId ? `${eventLabel(event)} · ${eventWeekLabel(event.eventDate)}` : '',
                  position: 'top',
                  fill: event.id === selectedEventId ? '#fde68a' : 'rgba(255, 255, 255, 0.95)',
                  fontSize: 10,
                  fontFamily: 'var(--font-body)'
                }}
              />
            ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={selectedYear === 'all'}
          className={`px-4 py-2 text-sm font-display uppercase tracking-[1px] border transition-colors ${
            selectedYear === 'all'
              ? 'border-transparent bg-brand-text text-brand-bg'
              : 'border-brand-border text-brand-text hover:border-brand-border-strong hover:bg-brand-surface-hover'
          }`}
          onClick={() => onSelectYear('all')}
        >
          전체
        </button>
        {availableYears.map((year) => (
          <button
            key={year}
            type="button"
            aria-pressed={selectedYear === year}
            className={`px-4 py-2 text-sm font-display uppercase tracking-[1px] border transition-colors ${
              selectedYear === year
                ? 'border-transparent bg-brand-text text-brand-bg'
                : 'border-brand-border text-brand-text hover:border-brand-border-strong hover:bg-brand-surface-hover'
            }`}
            onClick={() => onSelectYear(year)}
          >
            {year}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-body text-brand-muted">
          {selectedYear === 'all'
            ? `전체 ${events.length}개 사건`
            : `${selectedYear}년 사건 ${events.length}개`}
        </p>
        <p className="text-sm font-body text-brand-muted">노란 강조 = 지금 선택한 사건이 포함된 주간</p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <a
            key={event.id}
            href={buildHref(event.id)}
            aria-label={`${event.nameKo} 보기`}
            onClick={(clickEvent) => {
              clickEvent.preventDefault()
              onSelectEvent(event.id)
            }}
            className={`rounded-none border px-[24px] py-[24px] text-left transition-colors ${
              selectedEventId === event.id
                ? 'border-yellow-300 bg-yellow-300/10 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.35)]'
                : 'border-brand-border bg-transparent hover:border-brand-border-strong hover:bg-brand-surface-hover'
            }`}
          >
            <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{event.eventDate}</div>
            <div className="mt-2 text-base font-body text-brand-text">{eventLabel(event)}</div>
          </a>
        ))}
      </div>
    </SectionCard>
  )
}
