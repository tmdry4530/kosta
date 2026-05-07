import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { eventWeekLabel, startOfWeek } from '../src/lib/timeline'

function createMockComponent(label: string) {
  return function MockComponent({ children }: PropsWithChildren) {
    return <div data-testid={label}>{children}</div>
  }
}

const eventYears = [
  '2017', '2017', '2019', '2020', '2020', '2021',
  '2021', '2021', '2021', '2022', '2022', '2022',
  '2022', '2022', '2023', '2024', '2024', '2024',
  '2025', '2025', '2025'
]

const events = Array.from({ length: 21 }, (_, index) => ({
  id: index === 0 ? 'ftx_collapse' : `event_${index + 1}`,
  nameKo: index === 0 ? 'FTX 파산' : `이벤트 ${index + 1}`,
  nameEn: index === 0 ? 'FTX Collapse' : `Event ${index + 1}`,
  eventDate: `${eventYears[index]}-11-${String((index % 28) + 1).padStart(2, '0')}`,
  category: index % 4 === 0 ? 'crisis' : index % 4 === 1 ? 'rally' : index % 4 === 2 ? 'mania' : 'regulation',
  region: index < 6 ? 'kr' : 'global',
  description: index === 0 ? '세계 2위 거래소 FTX가 유동성 위기로 파산 신청.' : `설명 ${index + 1}`,
  sourceUrl: `https://example.com/${index + 1}`
}))

const whaleFlows = [
  {
    weekStart: '2022-11-07',
    asset: 'ETH',
    transferCount: '10',
    totalVolumeNative: '100',
    totalVolumeUsd: '1000000'
  }
]

const baseWindow = Array.from({ length: 15 }, (_, index) => ({
  dayOffset: index - 7,
  date: `2022-11-${String(index + 1).padStart(2, '0')}`,
  whaleVolumeUsd: '100',
  cexInflowUsd: '50',
  cexOutflowUsd: '25',
  ethPriceUsd: '1200',
  btcPriceUsd: '18000',
  fearGreedValue: 20,
  newsVolume: index % 4
}))

vi.mock('../src/api/endpoints', () => ({
  useEvents: () => ({ isLoading: false, isError: false, data: events }),
  useWhaleFlows: () => ({ isLoading: false, isError: false, data: whaleFlows }),
  useEventWindow: (eventId: string | null) => ({
    isLoading: false,
    isError: false,
    data:
      eventId === null
        ? undefined
        : {
            event: events.find((event) => event.id === eventId) ?? events[0],
            window:
              eventId === 'event_2'
                ? baseWindow.map((row) => ({
                    ...row,
                    cexInflowUsd: null,
                    cexOutflowUsd: null,
                    fearGreedValue: null,
                    newsVolume: 0
                  }))
                : baseWindow
          }
  }),
  useEventNews: (eventId: string | null) => ({
    isLoading: false,
    isError: false,
    data:
      eventId === 'event_2'
        ? [{ id: '2', source: 'coindesk', url: 'https://example.com/news2', title: '이벤트 2 뉴스', summary: '요약2', publishedAt: null, language: 'en' }]
        : [{ id: '1', source: 'coindesk', url: 'https://example.com/news', title: 'FTX 뉴스', summary: '요약', publishedAt: null, language: 'en' }]
  }),
  useFearGreed: () => ({ isLoading: false, isError: false, data: [] }),
  useCategoryWindows: () => []
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: createMockComponent('responsive-container'),
  LineChart: createMockComponent('line-chart'),
  Line: createMockComponent('line'),
  ReferenceArea: createMockComponent('reference-area'),
  ReferenceLine: createMockComponent('reference-line'),
  Tooltip: createMockComponent('tooltip'),
  XAxis: createMockComponent('x-axis'),
  YAxis: createMockComponent('y-axis'),
  Area: createMockComponent('area'),
  Bar: createMockComponent('bar'),
  CartesianGrid: createMockComponent('cartesian-grid'),
  ComposedChart: createMockComponent('composed-chart'),
  Legend: createMockComponent('legend'),
  BarChart: createMockComponent('bar-chart')
}))

import App from '../src/App'

beforeEach(() => {
  window.history.replaceState({}, '', '/?tab=timeline&event=ftx_collapse')
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('renders the timeline and detail view with all events by default', () => {
    render(<App />)

    expect(screen.getByText('시장이 흔들릴 때, 큰 지갑은 무엇을 했을까?')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FTX 파산' })).toBeInTheDocument()
    expect(screen.getByText(/모바일에서는 차트를 좌우로 밀어 날짜 축과 이벤트 위치를 더 선명하게 볼 수 있다/)).toBeInTheDocument()
    expect(screen.getByText('읽는 순서')).toBeInTheDocument()
    expect(screen.getByText(/가설 → 검증 → 결론/)).toBeInTheDocument()
    expect(screen.getByText('가설 1 · 판정 보류')).toBeInTheDocument()
    expect(screen.getAllByText('고래 송금').length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래소 입금').length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래소 출금').length).toBeGreaterThan(0)
    expect(screen.getAllByText('공포·탐욕 지수').length).toBeGreaterThan(0)
    expect(screen.getAllByText('뉴스 볼륨').length).toBeGreaterThan(0)
    expect(screen.getByText('그때 나온 헤드라인')).toBeInTheDocument()
    expect(screen.getByText('FTX 뉴스')).toBeInTheDocument()
    expect(screen.getByText('전체 21개 사건')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(21)
  }, 120_000)

  it('filters events by year and restores the full list', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '2024' }))
    expect(screen.getByText('2024년 사건 3개')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(3)

    fireEvent.click(screen.getByRole('button', { name: '전체' }))
    expect(screen.getByText('전체 21개 사건')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(21)
  }, 120_000)

  it('shows the six korean events in the korea tab', () => {
    window.history.replaceState({}, '', '/?tab=korea&event=ftx_collapse')
    render(<App />)

    expect(screen.getByRole('heading', { name: '한국 섹터' })).toBeInTheDocument()
    expect(screen.getAllByText(/^🇰🇷/).length).toBe(6)
  })

  it('shows hypothesis-led comparison cards in the compare tab', () => {
    window.history.replaceState({}, '', '/?tab=compare&event=ftx_collapse')
    render(<App />)

    expect(screen.getByRole('heading', { name: '가설 검증 비교실' })).toBeInTheDocument()
    expect(screen.getByText('가설 1')).toBeInTheDocument()
    expect(screen.getByText(/위기·폭락 이벤트는 사건일 거래소 입금이 가장 크게 튄다/)).toBeInTheDocument()
    expect(screen.getByText('가장 강한 입금 반응')).toBeInTheDocument()
    expect(screen.getByText('카테고리별 반응 히트맵')).toBeInTheDocument()
    expect(screen.getByText('지역별 반응 히트맵')).toBeInTheDocument()
  })

  it('updates the detail panel immediately when another event is selected', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: '이벤트 2 보기' }))
    expect(window.location.search).toContain('event=event_2')
    expect(screen.getByRole('heading', { name: '이벤트 2' })).toBeInTheDocument()
    const scopeNotice = screen.getByText('데이터 범위 안내').parentElement
    expect(scopeNotice).not.toBeNull()
    expect(scopeNotice?.textContent).toContain('거래소 입금, 거래소 출금, 공포·탐욕 지수')
    expect(scopeNotice?.textContent).toContain('부분 검증')
    const newsVolumeNotice = screen.getByText('뉴스 볼륨 보조 지표').parentElement
    expect(newsVolumeNotice).not.toBeNull()
    expect(newsVolumeNotice?.textContent).toContain('발행일이 확인된 기사 수가 부족해 회색 뉴스 볼륨 막대는 표시되지 않는다')
    expect(newsVolumeNotice?.textContent).toContain('발행일 정보가 없어 뉴스 볼륨 막대에는 포함되지 않았다')
    expect(screen.getByText('이벤트 2 뉴스')).toBeInTheDocument()
  })

  it('maps event dates into weekly chart buckets', () => {
    expect(startOfWeek('2022-05-09')).toBe('2022-05-09')
    expect(startOfWeek('2022-11-11')).toBe('2022-11-07')
    expect(eventWeekLabel('2022-11-11')).toBe('2022-11-07 ~ 2022-11-13')
  })
})
