import { useEffect, useMemo, useState } from 'react'

import { useEvents, useWhaleFlows } from './api/endpoints'
import { CategoryCompareView } from './features/compare/CategoryCompareView'
import { EventDetailPanel } from './features/event-detail/EventDetailPanel'
import { KoreaSectorView } from './features/korea/KoreaSectorView'
import { MainTimeline } from './features/timeline/MainTimeline'

const tabs = [
  { id: 'timeline', label: '메인 화면' },
  { id: 'compare', label: '이벤트 비교' },
  { id: 'korea', label: '한국 섹터' }
] as const

function useUiState() {
  const readState = (search: string) => {
    const params = new URLSearchParams(search)
    return {
      activeTab: (params.get('tab') ?? 'timeline') as 'timeline' | 'compare' | 'korea',
      selectedEventId: params.get('event'),
      selectedYear: params.get('year') ?? 'all'
    }
  }

  const [locationSearch, setLocationSearch] = useState(window.location.search)

  useEffect(() => {
    const handle = () => setLocationSearch(window.location.search)
    window.addEventListener('popstate', handle)
    return () => window.removeEventListener('popstate', handle)
  }, [])

  const state = readState(locationSearch)

  const setState = (next: { tab?: string; event?: string | null; year?: string }) => {
    const updated = new URLSearchParams(locationSearch)
    updated.set('tab', next.tab ?? state.activeTab)
    if (next.tab !== undefined) {
      updated.set('tab', next.tab as 'timeline' | 'compare' | 'korea')
    }
    if (next.event !== undefined) {
      if (next.event === null) {
        updated.delete('event')
      } else {
        updated.set('event', next.event)
      }
    }
    if (next.year !== undefined) {
      if (next.year === 'all') {
        updated.delete('year')
      } else {
        updated.set('year', next.year)
      }
    }
    const nextSearch = `?${updated.toString()}`
    window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}`)
    setLocationSearch(nextSearch)
  }

  return {
    activeTab: state.activeTab,
    selectedEventId: state.selectedEventId,
    selectedYear: state.selectedYear,
    setState
  }
}

function buildQueryHref(
  next: { tab?: string; event?: string | null; year?: string },
  current: { tab: string; event: string | null; year: string }
): string {
  const params = new URLSearchParams()
  params.set('tab', next.tab ?? current.tab)
  const eventId = next.event === undefined ? current.event : next.event
  const year = next.year ?? current.year
  if (eventId !== null) {
    params.set('event', eventId)
  }
  if (year !== 'all') {
    params.set('year', year)
  }
  return `?${params.toString()}`
}

export default function App() {
  const { activeTab, selectedEventId, selectedYear, setState } = useUiState()
  const eventsQuery = useEvents()
  const whaleFlowsQuery = useWhaleFlows()

  const body = useMemo(() => {
    if (eventsQuery.isLoading || whaleFlowsQuery.isLoading) {
      return <p className="text-base font-body text-brand-muted">대시보드를 준비하는 중...</p>
    }
    if (eventsQuery.isError || whaleFlowsQuery.isError || !eventsQuery.data || !whaleFlowsQuery.data) {
      return <p className="text-base font-body text-brand-text">데이터를 불러오지 못했다. API 상태를 확인해 주세요.</p>
    }

    if (activeTab === 'compare') {
      return <CategoryCompareView events={eventsQuery.data} />
    }
    if (activeTab === 'korea') {
      return (
        <KoreaSectorView
          events={eventsQuery.data}
          buildHref={(eventId) =>
            buildQueryHref(
              { tab: 'timeline', event: eventId, year: selectedYear },
              { tab: activeTab, event: selectedEventId, year: selectedYear }
            )
          }
          onSelectEvent={(eventId) => setState({ tab: 'timeline', event: eventId })}
        />
      )
    }

    const availableYears = Array.from(
      new Set(eventsQuery.data.map((event) => event.eventDate.slice(0, 4)))
    ).sort()

    const visibleEvents =
      selectedYear === 'all'
        ? eventsQuery.data
        : eventsQuery.data.filter((event) => event.eventDate.startsWith(selectedYear))

    const effectiveSelectedEventId =
      visibleEvents.find((event) => event.id === selectedEventId)?.id ??
      visibleEvents[0]?.id ??
      null

    return (
      <div className="space-y-6">
        <MainTimeline
          events={visibleEvents}
          whaleFlows={whaleFlowsQuery.data}
          selectedEventId={effectiveSelectedEventId}
          availableYears={availableYears}
          selectedYear={selectedYear}
          buildHref={(eventId) =>
            buildQueryHref(
              { tab: 'timeline', event: eventId, year: selectedYear },
              { tab: activeTab, event: effectiveSelectedEventId, year: selectedYear }
            )
          }
          onSelectYear={(year) => {
            const nextEvents =
              year === 'all'
                ? eventsQuery.data
                : eventsQuery.data.filter((event) => event.eventDate.startsWith(year))
            setState({
              tab: 'timeline',
              year,
              event: nextEvents[0]?.id ?? null
            })
          }}
          onSelectEvent={(eventId) => setState({ tab: 'timeline', event: eventId })}
        />
        <EventDetailPanel key={effectiveSelectedEventId ?? 'none'} eventId={effectiveSelectedEventId} />
      </div>
    )
  }, [
    activeTab,
    eventsQuery.data,
    eventsQuery.isError,
    eventsQuery.isLoading,
    selectedEventId,
    selectedYear,
    setState,
    whaleFlowsQuery.data,
    whaleFlowsQuery.isError,
    whaleFlowsQuery.isLoading
  ])

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text px-4 py-12 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="flex flex-col items-center justify-center text-center py-12">
          <div className="font-display text-sm uppercase tracking-[2px] text-brand-muted mb-4">When Whales Move</div>
          <h1 className="font-display font-light text-4xl md:text-6xl lg:text-7xl xl:text-[80px] leading-tight tracking-tight text-brand-text mb-6">
            시장이 흔들릴 때,<br className="hidden md:block" /> 고래들은 무엇을 했을까?
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-brand-muted font-body mb-12">
            복잡한 블록체인 용어 대신, 고래의 자금 흐름을 역사적 사건 위에 얹어 보여줍니다.
            사건 하나를 고르면 그 전후의 자금 이동과 헤드라인을 한눈에 볼 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-4">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={buildQueryHref(
                  { tab: tab.id, event: selectedEventId, year: selectedYear },
                  { tab: activeTab, event: selectedEventId, year: selectedYear }
                )}
                className={`transition-colors font-display text-[14px] uppercase tracking-[1.4px] px-[24px] py-[12px] border ${activeTab === tab.id ? 'bg-brand-text text-brand-bg border-transparent' : 'bg-transparent text-brand-text border-brand-border-strong hover:bg-brand-surface-hover'}`}
                onClick={(event) => {
                  event.preventDefault()
                  setState({ tab: tab.id, event: selectedEventId, year: selectedYear })
                }}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </header>
        {body}
      </div>
    </main>
  )
}
