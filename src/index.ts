import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import { ART_SCALE_RANGE, DEFAULT_PREFERENCES, INTENSITY_RANGE, SETTINGS_NAMESPACE } from './preferences.ts'

export const name = SETTINGS_NAMESPACE

/** Harness 0.1.7 exposes live plugin Config fields through configForms. */
export const Config = Schema.object({
  presentation: Schema.union(['character', 'focus']).default(DEFAULT_PREFERENCES.presentation).volatile(),
  background: Schema.boolean().default(DEFAULT_PREFERENCES.background).volatile(),
  side: Schema.union(['left', 'right']).default(DEFAULT_PREFERENCES.side).volatile(),
  intensity: Schema.number().step(1).min(INTENSITY_RANGE.min).max(INTENSITY_RANGE.max)
    .default(DEFAULT_PREFERENCES.intensity).volatile(),
  artScale: Schema.number().step(1).min(ART_SCALE_RANGE.min).max(ART_SCALE_RANGE.max)
    .default(DEFAULT_PREFERENCES.artScale).volatile(),
})

/** The client draws its own settings page, so the generic form is not shown automatically. */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], scope => {
    scope.effect(() => scope.settings.configure({ auto: false }, ctx.fiber))
  })
}
