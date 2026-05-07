export function startOfWeek(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`)
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  return date.toISOString().slice(0, 10)
}

export function endOfWeek(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 6)
  return date.toISOString().slice(0, 10)
}

export function eventWeekLabel(eventDate: string): string {
  const weekStart = startOfWeek(eventDate)
  const weekEnd = endOfWeek(weekStart)
  return `${weekStart} ~ ${weekEnd}`
}
