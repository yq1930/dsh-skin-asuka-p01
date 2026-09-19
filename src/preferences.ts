export interface AsukaPreferences {
  presentation: 'character' | 'focus'
  background: boolean
  side: 'left' | 'right'
  intensity: number
  artScale: number
}

export const SETTINGS_NAMESPACE = 'asuka-p01'

export const DEFAULT_PREFERENCES: Readonly<AsukaPreferences> = Object.freeze({
  presentation: 'character',
  background: true,
  side: 'left',
  intensity: 55,
  artScale: 100,
})

export const PREFERENCE_KEYS = [
  'presentation',
  'background',
  'side',
  'intensity',
  'artScale',
] as const

export function decodePreferences(input: unknown): AsukaPreferences | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return undefined
  if (!PREFERENCE_KEYS.every(key => Object.prototype.hasOwnProperty.call(input, key))) return undefined

  const { presentation, background, side, intensity, artScale } = input as Record<string, unknown>
  if (presentation !== 'character' && presentation !== 'focus') return undefined
  if (typeof background !== 'boolean') return undefined
  if (side !== 'left' && side !== 'right') return undefined
  if (typeof intensity !== 'number' || !Number.isInteger(intensity) || intensity < 0 || intensity > 100) return undefined
  if (typeof artScale !== 'number' || !Number.isInteger(artScale) || artScale < 60 || artScale > 120) return undefined

  return { presentation, background, side, intensity, artScale }
}

export function samePreferences(a: AsukaPreferences, b: AsukaPreferences): boolean {
  return PREFERENCE_KEYS.every(key => a[key] === b[key])
}
