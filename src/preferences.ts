export type Presentation = 'character' | 'focus'
export type Side = 'left' | 'right'

export interface AsukaPreferences {
  presentation: Presentation
  background: boolean
  side: Side
  intensity: number
  artScale: number
}

/**
 * Config-form namespaces are Host entry ids. This is also the Host plugin name, and
 * must match the entry id in cordis.patch.yml.
 */
export const SETTINGS_NAMESPACE = 'ui-skin-asuka-p01'

/** Inclusive integer ranges shared by the Host schema, the decoder and the sliders. */
export const INTENSITY_RANGE = { min: 0, max: 100 } as const
export const ART_SCALE_RANGE = { min: 60, max: 120 } as const

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
] as const satisfies readonly (keyof AsukaPreferences)[]

function inRange(value: unknown, range: { min: number; max: number }): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= range.min && value <= range.max
}

export function decodePreferences(input: unknown): AsukaPreferences | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return undefined
  if (!PREFERENCE_KEYS.every(key => Object.hasOwn(input, key))) return undefined

  const { presentation, background, side, intensity, artScale } = input as Record<string, unknown>
  if (presentation !== 'character' && presentation !== 'focus') return undefined
  if (typeof background !== 'boolean') return undefined
  if (side !== 'left' && side !== 'right') return undefined
  if (!inRange(intensity, INTENSITY_RANGE) || !inRange(artScale, ART_SCALE_RANGE)) return undefined

  return { presentation, background, side, intensity, artScale }
}

export function samePreferences(a: AsukaPreferences, b: AsukaPreferences): boolean {
  return PREFERENCE_KEYS.every(key => a[key] === b[key])
}
