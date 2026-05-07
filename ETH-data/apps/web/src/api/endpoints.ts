import { useQueries, useQuery } from '@tanstack/react-query'

import { fetchJson } from './client'
import {
  eventListSchema,
  eventWindowResponseSchema,
  fearGreedListSchema,
  newsListSchema,
  whaleFlowListSchema
} from './schemas'

const staleTime = 300_000

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => fetchJson('/api/events', eventListSchema),
    staleTime
  })
}

export function useWhaleFlows() {
  return useQuery({
    queryKey: ['whale-flows', 'ETH'],
    queryFn: () =>
      fetchJson(
        '/api/whale-flows?from=2017-01-01&to=2026-12-31&asset=ETH',
        whaleFlowListSchema
      ),
    staleTime
  })
}

export function useEventWindow(eventId: string | null) {
  return useQuery({
    queryKey: ['event-window', eventId],
    queryFn: () => fetchJson(`/api/events/${eventId}/window`, eventWindowResponseSchema),
    enabled: eventId !== null,
    staleTime
  })
}

export function useEventNews(eventId: string | null) {
  return useQuery({
    queryKey: ['event-news', eventId],
    queryFn: () => fetchJson(`/api/events/${eventId}/news?limit=5`, newsListSchema),
    enabled: eventId !== null,
    staleTime
  })
}

export function useFearGreed(from: string, to: string) {
  return useQuery({
    queryKey: ['fear-greed', from, to],
    queryFn: () => fetchJson(`/api/fear-greed?from=${from}&to=${to}`, fearGreedListSchema),
    staleTime
  })
}

export function useCategoryWindows(eventIds: string[]) {
  return useQueries({
    queries: eventIds.map((eventId) => ({
      queryKey: ['event-window', eventId],
      queryFn: () => fetchJson(`/api/events/${eventId}/window`, eventWindowResponseSchema),
      staleTime
    }))
  })
}
