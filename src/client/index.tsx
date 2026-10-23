import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { SETTINGS_NAMESPACE, type AsukaPreferences } from '../preferences.ts'
import { createBrandMark, HeroMark } from './brand.tsx'
import { hostTokenLayer } from './palette.ts'
import { installScene } from './scene/index.ts'
import { createSettingsPage } from './settings/index.tsx'
import { stylesheet } from './stylesheet.ts'

const PACKAGE_NAME = 'dsh-skin-asuka-p01'
export const name = 'ui-skin-asuka-p01-client'
export const inject = ['slots', 'theme', 'configForms']

export function apply(ctx: Context): void {
  const form = ctx.configForms.get<AsukaPreferences>(SETTINGS_NAMESPACE)
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = PACKAGE_NAME
    style.dataset.pluginCss = `${PACKAGE_NAME}/theme.css`
    style.textContent = stylesheet
    document.head.append(style)
    return () => style.remove()
  }, 'asuka-p01: scoped styles')
  ctx.effect(() => ctx.theme.overrideTokens(PACKAGE_NAME, hostTokenLayer()), 'asuka-p01: theme token layer')
  ctx.effect(() => {
    const scene = installScene()
    const update = () => { const state = form.getSnapshot(); scene.update(state.status === 'ready' ? state.value : undefined) }
    const unwatch = form.subscribe(update)
    update()
    return () => { unwatch(); scene.dispose() }
  }, 'asuka-p01: character stage')

  ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({ name: 'sidebar.brand.mark', priority: -20 }, createBrandMark(form)))
  ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -20 }, HeroMark))
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'asuka-p01', label: '明日香 P01', order: 90 }, createSettingsPage(form)))
}
