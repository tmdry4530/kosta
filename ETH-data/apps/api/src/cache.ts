import { LRUCache } from 'lru-cache'

type CacheValue = Record<string, unknown> | Array<unknown>

const cache = new LRUCache<string, CacheValue>({
  max: 500,
  ttl: 1000 * 60 * 5
})

export function getCached<T extends CacheValue>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

export function setCached<T extends CacheValue>(key: string, value: T): T {
  cache.set(key, value)
  return value
}
