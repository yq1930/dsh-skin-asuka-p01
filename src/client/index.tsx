import { useSyncExternalStore } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { artwork } from 'asuka:art'
import css from './theme.css'
import chromeCss from './chrome.css'
import { ornamentCssVariables } from './ornaments.ts'
import { createSettingsPage } from './settings.tsx'
import { installScene } from './scene.ts'
import { SETTINGS_NAMESPACE, decodePreferences, type AsukaPreferences } from '../preferences.ts'

const PACKAGE_NAME = 'dsh-skin-asuka-p01'
export const name = 'ui-skin-asuka-p01-client'
export const inject = ['slots', 'theme', 'settingsScope']

/** Derive the official token layer from the same literal palette as the scoped stylesheet. */
function themeTokens() {
  const blocks = [...css.matchAll(/body\[data-dsh-asuka-p01\](\[data-ds-dark-theme\])?\s*\{([^}]+)\}/g)]
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  const aliases: Record<string, string> = {}
  for (const block of blocks) {
    const palette = block[1] ? dark : light
    for (const m of block[2].matchAll(/(--asuka-[\w-]+):\s*(#[\da-fA-F]+)\s*;/g)) palette[m[1]] = m[2]
    if (!block[1]) for (const m of block[2].matchAll(/(--dsw-[\w-]+):\s*var\((--asuka-[\w-]+)\)\s*;/g)) aliases[m[1]] = m[2]
  }
  return Object.fromEntries(Object.entries(aliases).map(([token, alias]) => [token, { light: light[alias], dark: dark[alias] ?? light[alias] }]))
}

export function apply(ctx: Context): void {
  const scope = ctx.settingsScope.bind<AsukaPreferences>({ namespace: SETTINGS_NAMESPACE, decode: decodePreferences })
  const subscribe = (listener: () => void) => scope.subscribe(listener)
  const getSnapshot = () => scope.getSnapshot()
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = PACKAGE_NAME
    style.dataset.pluginCss = `${PACKAGE_NAME}/theme.css`
    style.textContent = `${css}\n${chromeCss}\nbody[data-dsh-asuka-p01]{${ornamentCssVariables}--asuka-portrait-art:url("${artwork.portrait}");--asuka-ribbon-art:url("${artwork.ribbon}");}`
    document.head.append(style)
    return () => style.remove()
  }, 'asuka-p01: scoped styles')
  ctx.effect(() => ctx.theme.overrideTokens(PACKAGE_NAME, themeTokens()), 'asuka-p01: theme token layer')
  ctx.effect(() => {
    const scene = installScene()
    const update = () => { const state = scope.getSnapshot(); scene.update(state.status === 'ready' ? state.value : undefined) }
    const unwatch = scope.subscribe(update)
    update()
    return () => { unwatch(); scene.dispose() }
  }, 'asuka-p01: character stage')

  function Mark({ size, className }: { size: number; className?: string }) {
    const state = useSyncExternalStore(subscribe, getSnapshot)
    const show = state.status === 'ready' && state.value?.presentation === 'character'
    return show
      ? <img className={`asuka-brand-image ${className ?? ''}`} src={artwork.portrait} alt="明日香绯色天际" width={size} height={size} draggable={false} />
      : <span className={`asuka-brand-number ${className ?? ''}`} style={{ width: size, height: size, fontSize: Math.max(12, size * 0.58) }} aria-label="明日香绯色天际">02</span>
  }
  function HeroMark() {
    return <span className="asuka-hero-emblem" role="img" aria-label="明日香绯色天际"><span>02</span></span>
  }
  ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({ name: 'sidebar.brand.mark', priority: -20 }, Mark))
  ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -20 }, HeroMark))
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'asuka-p01', label: '明日香 P01', order: 90 }, createSettingsPage(scope)))
}
