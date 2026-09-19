import { artwork } from 'asuka:art'
import type { AsukaPreferences } from '../preferences.ts'

const COLUMN = ":is([data-pane='conversation'], [class*='centerCol'])"
const PHASE = '[data-phase="hero"], [data-phase="active"], [data-phase="settling"]'
const CONTENT = '[data-composer-card], [data-chat-flow]'

/** Own writes only; a later writer's value is never rolled back on disposal. */
function attributes(element: HTMLElement) {
  const original = new Map<string, string | null>()
  const written = new Map<string, string>()
  return {
    set(name: string, value: string) {
      if (!original.has(name)) original.set(name, element.getAttribute(name))
      written.set(name, value)
      if (element.getAttribute(name) !== value) element.setAttribute(name, value)
    },
    dispose() {
      for (const [name, value] of written) {
        if (element.getAttribute(name) !== value) continue
        const before = original.get(name)
        if (before == null) element.removeAttribute(name)
        else element.setAttribute(name, before)
      }
      original.clear()
      written.clear()
    },
  }
}

/** The DOM adapter is limited to the tested Harness conversation-column markers. */
export function installScene() {
  const body = attributes(document.body)
  body.set('data-dsh-asuka-p01', '')
  body.set('data-asuka-mode', 'focus')
  body.set('data-asuka-background', 'false')
  const stage = document.createElement('div')
  stage.className = 'asuka-stage'
  stage.dataset.skinOwner = 'asuka-p01'
  stage.dataset.phase = 'unknown'
  stage.dataset.artVisible = 'false'
  stage.setAttribute('aria-hidden', 'true')
  stage.style.setProperty('--asuka-scene-day', `url("${artwork.day}")`)
  stage.style.setProperty('--asuka-scene-night', `url("${artwork.night}")`)
  const background = document.createElement('div')
  background.className = 'asuka-stage__background'
  const character = document.createElement('img')
  character.className = 'asuka-stage__character'
  character.alt = ''
  character.draggable = false
  character.src = artwork.front
  const mark = document.createElement('span')
  mark.className = 'asuka-stage__mark'
  mark.textContent = 'ASUKA / 02'
  stage.append(background, character, mark)
  let prefs: AsukaPreferences | undefined
  let column: HTMLElement | null = null
  let columnAttributes: ReturnType<typeof attributes> | undefined
  const resizeTargets = new Set<HTMLElement>()
  let stopped = false
  let frame = 0
  let failedImage = false

  const setSize = (name: string, value: number) => {
    const next = `${Math.round(value)}px`
    if (stage.style.getPropertyValue(name) !== next) stage.style.setProperty(name, next)
  }
  const refresh = () => {
    frame = 0
    if (stopped) return
    const next = document.querySelector<HTMLElement>(COLUMN)
    if (next !== column) {
      resize.disconnect()
      resizeTargets.clear()
      columnAttributes?.dispose()
      columnAttributes = undefined
      column = next
      if (column) {
        columnAttributes = attributes(column)
        column.prepend(stage)
      } else stage.remove()
    } else if (column && stage.parentElement !== column) column.prepend(stage)
    if (!column) { stage.dataset.artVisible = 'false'; return }
    const bounds = column.getBoundingClientRect()
    columnAttributes?.set('data-asuka-density', bounds.width >= 1100 ? 'normal' : bounds.width >= 850 ? 'compact' : 'narrow')
    const host = [...column.querySelectorAll<HTMLElement>(PHASE)].find(el => el !== stage && !stage.contains(el))
    const elements = host ? [...host.querySelectorAll<HTMLElement>(CONTENT)] : []
    const seats = host ? [...host.querySelectorAll<HTMLElement>('[data-composer-seat]')] : []
    // Input height and reading-panel width can change without resizing the column.
    // Reconcile targets on every refresh so replaced conversation nodes are released.
    const nextResizeTargets = new Set([column, ...elements, ...seats])
    for (const element of resizeTargets) {
      if (nextResizeTargets.has(element)) continue
      resize.unobserve(element)
      resizeTargets.delete(element)
    }
    for (const element of nextResizeTargets) {
      if (resizeTargets.has(element)) continue
      resize.observe(element)
      resizeTargets.add(element)
    }
    const phase = host?.dataset.phase
    stage.dataset.phase = phase === 'hero' ? 'hero' : phase === 'active' || phase === 'settling' ? 'active' : 'unknown'
    stage.dataset.artVisible = 'false'
    if (!prefs || prefs.presentation === 'focus' || !host || failedImage) return
    const content = elements
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 40 && r.height > 0 && r.right > bounds.left && r.left < bounds.right)
    // Unknown markup falls back to colors/avatar, without guessing over live controls.
    if (!content.length || bounds.width < 700 || bounds.height < 380) return
    const leftEdge = Math.max(bounds.left, Math.min(...content.map(r => r.left)))
    const rightEdge = Math.min(bounds.right, Math.max(...content.map(r => r.right)))
    const space = prefs.side === 'left' ? leftEdge - bounds.left : bounds.right - rightEdge
    const lane = space - 36
    if (lane < 100) return
    // Active input/metadata now share an opaque seat. Keep the feet above its
    // visible top, even when the input card itself is lower or grows taller.
    const composerSurfaces = [...host.querySelectorAll<HTMLElement>('[data-composer-card], [data-composer-seat]')]
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0 && r.bottom > bounds.top && r.top < bounds.bottom)
    const bottom = phase !== 'hero' && composerSurfaces.length
      ? Math.max(0, bounds.bottom - Math.min(...composerSurfaces.map(r => r.top)) + 16) : 0
    const availableHeight = bounds.height - bottom - 28
    if (availableHeight < 220) return
    const width = Math.min(lane, 270 * prefs.artScale / 100)
    const height = Math.min(availableHeight, width / artwork.frontAspect, bounds.height * (phase === 'hero' ? 0.86 : 0.76))
    setSize('--asuka-art-left', prefs.side === 'left' ? 16 : bounds.width - width - 16)
    setSize('--asuka-art-width', width)
    setSize('--asuka-art-height', height)
    setSize('--asuka-art-bottom', bottom)
    stage.dataset.artVisible = 'true'
  }
  const schedule = () => {
    if (!stopped && !frame) frame = requestAnimationFrame(refresh)
  }
  const resize = new ResizeObserver(schedule)
  const mutations = new MutationObserver(records => {
    if (records.some(record => record.target !== stage && !stage.contains(record.target))) schedule()
  })
  mutations.observe(document.body, { subtree: true, childList: true, attributes: true,
    attributeFilter: ['data-phase', 'data-content-phase', 'class', 'style'] })
  window.addEventListener('resize', schedule)
  const onLoad = () => { failedImage = false; schedule() }
  const onError = () => { failedImage = true; stage.dataset.artVisible = 'false' }
  character.addEventListener('load', onLoad)
  character.addEventListener('error', onError)
  schedule()
  return {
    update(value: AsukaPreferences | undefined) {
      if (stopped) return
      prefs = value
      body.set('data-asuka-mode', value?.presentation ?? 'focus')
      body.set('data-asuka-background', String(!!value && value.background && value.presentation === 'character'))
      stage.style.setProperty('--asuka-scene-opacity', String((value?.intensity ?? 0) / 100))
      schedule()
    },
    dispose() {
      if (stopped) return
      stopped = true
      if (frame) cancelAnimationFrame(frame)
      mutations.disconnect()
      resize.disconnect()
      resizeTargets.clear()
      columnAttributes?.dispose()
      window.removeEventListener('resize', schedule)
      character.removeEventListener('load', onLoad)
      character.removeEventListener('error', onError)
      stage.remove()
      body.dispose()
    },
  }
}
