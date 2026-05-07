import { z } from 'zod'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export async function fetchJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  const payload = await response.json()
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'API request failed'
    throw new Error(message)
  }
  return schema.parse(payload)
}

export { API_BASE }
