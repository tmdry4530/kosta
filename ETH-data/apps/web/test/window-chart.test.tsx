import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'

function createMockComponent(label: string) {
  return function MockComponent({ children }: PropsWithChildren) {
    return <div data-testid={label}>{children}</div>
  }
}

vi.mock('recharts', () => ({
  ResponsiveContainer: createMockComponent('responsive-container'),
  LineChart: createMockComponent('line-chart'),
  Line: createMockComponent('line'),
  ReferenceLine: createMockComponent('reference-line'),
  Tooltip: createMockComponent('tooltip'),
  XAxis: createMockComponent('x-axis'),
  YAxis: createMockComponent('y-axis'),
  CartesianGrid: createMockComponent('cartesian-grid'),
  BarChart: createMockComponent('bar-chart'),
  Bar: createMockComponent('bar'),
  ComposedChart: createMockComponent('composed-chart')
}))

import { WindowChart } from '../src/features/event-detail/WindowChart'

describe('WindowChart', () => {
  it('renders the highlighted event reference without crashing', () => {
    render(
      <WindowChart
        rows={[
          {
            dayOffset: -1,
            date: '2022-11-10',
            whaleVolumeUsd: '100',
            cexInflowUsd: '50',
            cexOutflowUsd: '25',
            ethPriceUsd: '1200',
            btcPriceUsd: '18000',
            fearGreedValue: 35,
            newsVolume: 2
          },
          {
            dayOffset: 0,
            date: '2022-11-11',
            whaleVolumeUsd: '300',
            cexInflowUsd: '150',
            cexOutflowUsd: '40',
            ethPriceUsd: '1180',
            btcPriceUsd: '17500',
            fearGreedValue: 20,
            newsVolume: 5
          },
          {
            dayOffset: 1,
            date: '2022-11-12',
            whaleVolumeUsd: '220',
            cexInflowUsd: '70',
            cexOutflowUsd: '55',
            ethPriceUsd: '1210',
            btcPriceUsd: '17800',
            fearGreedValue: 25,
            newsVolume: 1
          }
        ]}
      />
    )

    expect(screen.getAllByText('기준선 100 = 사건 전 7일 평균').length).toBeGreaterThan(0)
    expect(screen.getAllByText('고래 송금').length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래소 입금').length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래소 출금').length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래소 순유입').length).toBeGreaterThan(0)
    expect(screen.getAllByText('시장 컨텍스트').length).toBeGreaterThan(0)
    expect(screen.getAllByText('뉴스 볼륨').length).toBeGreaterThan(0)
  })
})
