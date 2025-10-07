import { resultSchema, type Line, type Lines } from './schemas'

export async function getSummary(lines: Line[], previous: Line[]) {
  try {
    const response = await fetch('/api/errors', {
      body: JSON.stringify({ lines, previous } satisfies Lines),
      method: 'POST',
    })

    if (!response.ok) {
      console.warn(`Failed to fetch errors summary: ${response.statusText}`)
      return null
    }

    const body = await response.json()
    return resultSchema.parse(body)
  } catch (error) {
    console.warn('Error fetching errors summary:', error)
    return null
  }
}
