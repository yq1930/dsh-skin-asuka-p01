import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import { DEFAULT_PREFERENCES, SETTINGS_NAMESPACE, type AsukaPreferences } from './preferences.ts'

export const name = 'ui-skin-asuka-p01'

export const PreferenceSchema: Schema<AsukaPreferences> = Schema.object({
  presentation: Schema.union(['character', 'focus']).default(DEFAULT_PREFERENCES.presentation),
  background: Schema.boolean().default(DEFAULT_PREFERENCES.background),
  side: Schema.union(['left', 'right']).default(DEFAULT_PREFERENCES.side),
  intensity: Schema.number().step(1).min(0).max(100).default(DEFAULT_PREFERENCES.intensity),
  artScale: Schema.number().step(1).min(60).max(120).default(DEFAULT_PREFERENCES.artScale),
})

export function apply(ctx: Context): void {
  ctx.inject(['settings'], scope => {
    scope.settings.register(SETTINGS_NAMESPACE, PreferenceSchema)
  })
}
