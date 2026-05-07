import { SectionCard } from '../../components/SectionCard'
import { formatUsdString } from '../../lib/format'
import { analyzeEventWindow, buildHypothesisCards } from '../../lib/eventAnalysis'
import { useEventNews, useEventWindow } from '../../api/endpoints'
import { NewsList } from './NewsList'
import { WindowChart } from './WindowChart'

export function EventDetailPanel({ eventId }: { eventId: string | null }) {
  const windowQuery = useEventWindow(eventId)
  const newsQuery = useEventNews(eventId)

  if (eventId === null) {
    return (
      <SectionCard title="이벤트 디테일" eyebrow="선택된 사건">
        <p className="text-base leading-relaxed text-brand-muted font-body">타임라인에서 사건을 선택하면 당시의 송금 흐름과 뉴스 헤드라인을 볼 수 있다.</p>
      </SectionCard>
    )
  }

  if (windowQuery.isLoading || newsQuery.isLoading) {
    return <SectionCard title="이벤트 디테일" eyebrow="선택된 사건"><p className="text-base leading-relaxed text-brand-muted font-body">불러오는 중...</p></SectionCard>
  }

  if (windowQuery.isError || newsQuery.isError || !windowQuery.data) {
    return <SectionCard title="이벤트 디테일" eyebrow="선택된 사건"><p className="text-base leading-relaxed font-body" style={{ color: 'rgba(255, 255, 255, 0.7)'}}>이벤트 데이터를 가져오지 못했다.</p></SectionCard>
  }

  const event = windowQuery.data.event
  const summary = analyzeEventWindow(windowQuery.data.window)
  const hypothesisCards = buildHypothesisCards(event, summary)
  const visibleHypothesisLabels = hypothesisCards
    .map((card) => (card.badge.split(' · ')[0] ?? card.badge).replace('가설 ', ''))
    .join('·')
  const undatedNewsCount = (newsQuery.data ?? []).filter((item) => item.publishedAt === null).length
  const hasDatedNewsVolume = windowQuery.data.window.some((row) => row.newsVolume > 0)
  const hasInflowData = windowQuery.data.window.some((row) => row.cexInflowUsd !== null)
  const hasOutflowData = windowQuery.data.window.some((row) => row.cexOutflowUsd !== null)
  const hasFearGreedData = windowQuery.data.window.some((row) => row.fearGreedValue !== null)
  const missingSignals = [
    hasInflowData ? null : '거래소 입금',
    hasOutflowData ? null : '거래소 출금',
    hasFearGreedData ? null : '공포·탐욕 지수'
  ].filter((value): value is string => value !== null)

  return (
    <SectionCard title={event.nameKo} eyebrow="선택된 사건">
      <p className="text-base leading-relaxed text-brand-muted font-body">{event.description}</p>
      <div className="mt-4 border border-indigo-300/50 bg-indigo-300/10 p-4">
        <div className="font-display text-[12px] uppercase tracking-[1px] text-indigo-200">읽는 순서</div>
        <p className="mt-2 text-base leading-relaxed text-brand-text font-body">
          이 화면은 <span className="font-semibold text-indigo-100">가설 → 검증 → 결론</span> 순서로 읽을 수 있게 정리했다.
          전체 5개 가설 가운데 이 사건 화면에서 바로 확인할 수 있는 <span className="font-semibold text-indigo-100">가설 {visibleHypothesisLabels}</span>를 먼저 보여준다.
          먼저 사건일 스냅샷을 보고, 아래 가설 카드에서 전 7일 평균과 사건일을 비교한 뒤 차트에서 흐름을 확인하면 된다.
        </p>
      </div>
      {missingSignals.length > 0 ? (
        <div className="mt-4 border border-yellow-300/50 bg-yellow-300/10 p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-yellow-200">데이터 범위 안내</div>
          <p className="mt-2 text-base leading-relaxed text-brand-text font-body">
            이 사건은 <span className="font-semibold text-yellow-100">{missingSignals.join(', ')}</span> 원천 데이터가 없어
            사용 가능한 지표만으로 부분 검증을 보여준다.
          </p>
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {hypothesisCards.map((card) => (
          <article key={card.id} className="border border-brand-border bg-[#10141d] p-4">
            <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{card.badge}</div>
            <h3 className="mt-2 text-lg font-body text-brand-text break-keep leading-snug">{card.title}</h3>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed font-body">
              <div>
                <dt className="font-display text-[11px] uppercase tracking-[1px] text-sky-200">가설</dt>
                <dd className="mt-1 text-brand-text">{card.hypothesis}</dd>
              </div>
              <div>
                <dt className="font-display text-[11px] uppercase tracking-[1px] text-amber-200">검증</dt>
                <dd className="mt-1 text-brand-text">{card.validation}</dd>
              </div>
              <div>
                <dt className="font-display text-[11px] uppercase tracking-[1px] text-emerald-200">결론</dt>
                <dd className="mt-1 text-brand-text">{card.conclusion}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-sky-300/50 bg-sky-300/10 p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-sky-200">사건일 고래 송금</div>
          <div className="mt-2 text-[22px] font-body text-brand-text">
            {formatUsdString(summary.eventDayRow?.whaleVolumeUsd ?? null)}
          </div>
          <p className="mt-2 text-sm font-body text-sky-100/80">전 7일 평균 대비 사건일 자금 이동 규모</p>
        </div>
        <div className="border border-amber-300/50 bg-amber-300/10 p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-amber-200">사건일 거래소 입금</div>
          <div className="mt-2 text-[22px] font-body text-brand-text">
            {formatUsdString(summary.eventDayRow?.cexInflowUsd ?? null)}
          </div>
          <p className="mt-2 text-sm font-body text-amber-100/80">사건일 유입 강도를 읽는 기준 지표</p>
        </div>
        <div className="border border-emerald-300/50 bg-emerald-300/10 p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-emerald-200">사건일 거래소 출금</div>
          <div className="mt-2 text-[22px] font-body text-brand-text">
            {formatUsdString(summary.eventDayRow?.cexOutflowUsd ?? null)}
          </div>
          <p className="mt-2 text-sm font-body text-emerald-100/80">재배치 또는 보유 반응을 읽는 보조 지표</p>
        </div>
        <div className="border border-fuchsia-300/50 bg-fuchsia-300/10 p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-fuchsia-200">공포·탐욕 지수</div>
          <div className="mt-2 text-[22px] font-body text-brand-text">
            {summary.eventDayRow?.fearGreedValue ?? '데이터 없음'}
          </div>
          <p className="mt-2 text-sm font-body text-fuchsia-100/80">시장 심리를 읽는 보조 지표</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">전후 7일 최대 고래 송금</div>
          <div className="mt-2 text-lg font-body text-brand-text">{formatUsdString(String(summary.peakWhaleVolume.toFixed(2)))}</div>
          <p className="mt-2 text-sm font-body text-brand-muted">차트에서 가장 크게 튄 고래 이동 규모</p>
        </div>
        <div className="border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">사건 전 7일 평균 입금</div>
          <div className="mt-2 text-lg font-body text-brand-text">{formatUsdString(summary.inflow.before === null ? null : String(summary.inflow.before.toFixed(2)))}</div>
          <p className="mt-2 text-sm font-body text-brand-muted">사건일과 비교하는 기준선</p>
        </div>
        <div className="border border-brand-border bg-brand-surface p-4">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">사건 후 7일 ETH 평균 가격</div>
          <div className="mt-2 text-lg font-body text-brand-text">{formatUsdString(summary.ethPrice.after === null ? null : String(summary.ethPrice.after.toFixed(2)))}</div>
          <p className="mt-2 text-sm font-body text-brand-muted">사건 이후 시장 해석을 읽는 지표</p>
        </div>
      </div>
      <div className="mt-4 border border-slate-300/30 bg-slate-300/5 p-4">
        <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">뉴스 볼륨 보조 지표</div>
        {hasDatedNewsVolume ? (
          <p className="mt-2 text-base leading-relaxed text-brand-text font-body">
            사건일 뉴스 기사 수는 <span className="font-semibold">{summary.newsVolume.eventDay ?? 0}건</span>이고,
            전후 7일 중 가장 많이 기사화된 날은 <span className="font-semibold">{summary.peakNewsVolume}건</span>이었다.
            아래 회색 막대로 뉴스 반응이 온체인 움직임보다 먼저 터졌는지, 뒤따랐는지 함께 읽을 수 있다.
          </p>
        ) : undatedNewsCount > 0 ? (
          <p className="mt-2 text-base leading-relaxed text-brand-text font-body">
            현재 헤드라인은 있지만 발행일이 확인된 기사 수가 부족해 회색 뉴스 볼륨 막대는 표시되지 않는다.
            날짜 정보가 확인된 기사가 쌓이면 이 구간에서 온체인 움직임과 뉴스 반응의 선후를 직접 비교할 수 있다.
          </p>
        ) : (
          <p className="mt-2 text-base leading-relaxed text-brand-text font-body">
            이 사건 구간에는 집계 가능한 뉴스 볼륨 데이터가 없어, 현재는 온체인 지표 중심으로 해석한다.
          </p>
        )}
        {undatedNewsCount > 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-brand-muted font-body">
            다만 현재 헤드라인 중 <span className="font-semibold text-brand-text">{undatedNewsCount}건</span>은 발행일 정보가 없어
            뉴스 볼륨 막대에는 포함되지 않았다. 즉, 회색 막대는 <span className="font-semibold text-brand-text">날짜가 확인된 기사만</span> 집계한 값이다.
          </p>
        ) : null}
      </div>
      <div className="mt-6">
        <div className="mb-3">
          <h3 className="text-[22px] font-body text-brand-text">가설 검증 그래프</h3>
          <p className="mt-2 text-base leading-relaxed text-brand-muted font-body">
            첫 번째 패널은 사건 전 7일 평균을 100으로 둔 정규화 그래프라서, 어떤 지표가 평소 대비 더 크게 튀었는지 바로 읽을 수 있다.
            두 번째 패널은 거래소 순유입, 세 번째 패널은 가격·심리·뉴스 같은 보조 맥락이다.
            모바일에서는 차트를 좌우로 밀어 축 레이블을 더 선명하게 볼 수 있다.
          </p>
        </div>
        <WindowChart rows={windowQuery.data.window} />
      </div>
      <div className="mt-8">
        <h3 className="mb-6 text-[22px] font-body text-brand-text">그때 나온 헤드라인</h3>
        <NewsList items={newsQuery.data ?? []} />
      </div>
    </SectionCard>
  )
}
