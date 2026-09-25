import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import { DEFAULT_PREFERENCES } from './preferences.ts'

export const name = 'ui-skin-asuka-p01'

/** Harness 0.1.7 exposes live plugin Config fields through configForms. */
export const Config = Schema.object({
  presentation: Schema.union(['character', 'focus']).default(DEFAULT_PREFERENCES.presentation).volatile(),
  background: Schema.boolean().default(DEFAULT_PREFERENCES.background).volatile(),
  side: Schema.union(['left', 'right']).default(DEFAULT_PREFERENCES.side).volatile(),
  intensity: Schema.number().step(1).min(0).max(100).default(DEFAULT_PREFERENCES.intensity).volatile(),
  artScale: Schema.number().step(1).min(60).max(120).default(DEFAULT_PREFERENCES.artScale).volatile(),
})

export function apply(ctx: Context): void {
  ctx.inject(['settings'], scope => {
    scope.effect(() => scope.settings.configure({ auto: false }, ctx.fiber))
  })
}
