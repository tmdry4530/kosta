export function formatCompactNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '데이터 없음'
  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export function formatUsdString(value: string | null): string {
  if (value === null) return '데이터 없음'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return value
  return `$${formatCompactNumber(numberValue)}`
}

export function categoryColor(category: string): string {
  switch (category) {
    case 'crash':
    case 'crisis':
      return 'rgba(255, 255, 255, 0.8)'
    case 'rally':
      return 'rgba(255, 255, 255, 0.6)'
    case 'mania':
      return 'rgba(255, 255, 255, 0.4)'
    case 'regulation':
      return 'rgba(255, 255, 255, 0.3)'
    default:
      return 'rgba(255, 255, 255, 0.2)'
  }
}
