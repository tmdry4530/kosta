export function sanitizeNewsText(value: string | null | undefined): string | null {
  if (!value) return null

  const cleaned = value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/X icon/gi, ' ')
    .replace(/[*_#>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.length > 0 ? cleaned : null
}
