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
  stage.dataset.companionVisible = 'false'
  stage.setAttribute('aria-hidden', 'true')
  stage.style.setProperty('--asuka-scene-day', `url("${artwork.day}")`)
  stage.style.setProperty('--asuka-scene-night', `url("${artwork.night}")`)
  const background = document.createElement('div')
  background.className = 'asuka-stage__background'
  const frameArt = document.createElement('div')
  frameArt.className = 'asuka-stage__frame'
  const character = document.createElement('img')
  character.className = 'asuka-stage__character'
  character.alt = ''
  character.draggable = false
  const companion = document.createElement('img')
  companion.className = 'asuka-stage__companion'
  companion.alt = ''
  companion.draggable = false
  const mark = document.createElement('span')
  mark.className = 'asuka-stage__mark'
  mark.textContent = 'ASUKA / 02'
  stage.append(background, frameArt, character, companion, mark)
  let prefs: AsukaPreferences | undefined
  let column: HTMLElement | null = null
  let columnAttributes: ReturnType<typeof attributes> | undefined
  const resizeTargets = new Set<HTMLElement>()
  let stopped = false
  let frame = 0
  let characterLoaded = false
  let characterSource = artwork.welcome
  let companionLoaded = false

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
    stage.dataset.artVisible = 'false'
    stage.dataset.companionVisible = 'false'
    if (!column) return
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
    // Reading uses the narrower resting pose; welcome keeps its open gesture.
    // Change the source only when the phase actually selects a different image.
    const reading = phase === 'active' || phase === 'settling'
    const nextCharacterSource = reading ? artwork.front : artwork.welcome
    if (host && nextCharacterSource !== characterSource) {
      characterLoaded = false
      characterSource = nextCharacterSource
      character.src = characterSource
    }
    if (!prefs || prefs.presentation === 'focus' || !host) return
    const content = elements
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 40 && r.height > 0 && r.right > bounds.left && r.left < bounds.right)
    // Unknown markup falls back to colors/avatar, without guessing over live controls.
    if (!content.length || bounds.width < 700 || bounds.height < 380) return
    const leftEdge = Math.max(bounds.left, Math.min(...content.map(r => r.left)))
    const rightEdge = Math.min(bounds.right, Math.max(...content.map(r => r.right)))
    const opposite = prefs.side === 'left' ? 'right' : 'left'
    const figures = [
      { prefix: 'art', side: prefs.side, aspect: reading ? artwork.frontAspect : artwork.welcomeAspect, loaded: characterLoaded,
        visible: 'artVisible', heroHeight: 0.86 },
      { prefix: 'companion', side: opposite, aspect: artwork.studyAspect, loaded: companionLoaded,
        visible: 'companionVisible', heroHeight: 0.82 },
    ] as const
    const place = (figure: typeof figures[number], height: number, bottom: number, inset: number) => {
      const width = height * figure.aspect
      setSize(`--asuka-${figure.prefix}-left`, figure.side === 'left' ? inset : bounds.width - width - inset)
      setSize(`--asuka-${figure.prefix}-width`, width)
      setSize(`--asuka-${figure.prefix}-height`, height)
      setSize(`--asuka-${figure.prefix}-bottom`, bottom)
      stage.dataset[figure.visible] = 'true'
    }
    // These are two distinct poses, never a mirrored copy. The welcome figures
    // may extend behind the opaque input card, but leave the top frame clear.
    if (phase === 'hero' && bounds.width >= 1000 && bounds.height >= 600) {
      for (const figure of figures) {
        if (!figure.loaded) continue
        const height = Math.min(
          bounds.height * figure.heroHeight * prefs.artScale / 100,
          bounds.height - 90,
          bounds.width * 0.34 / figure.aspect,
        )
        place(figure, height, 20, 20)
      }
      return
    }
    // Active input/metadata share an opaque seat. Keep both figures' feet above
    // its visible top, even when the input card itself is lower or grows taller.
    const composerSurfaces = [...host.querySelectorAll<HTMLElement>('[data-composer-card], [data-composer-seat]')]
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0 && r.bottom > bounds.top && r.top < bounds.bottom)
    const bottom = phase !== 'hero' && composerSurfaces.length
      ? Math.max(0, bounds.bottom - Math.min(...composerSurfaces.map(r => r.top)) + 16) : 20
    const availableHeight = bounds.height - bottom - 70
    if (availableHeight < 220) return
    let candidates: { figure: typeof figures[number]; height: number }[] = []
    for (const figure of figures) {
      if (!figure.loaded) continue
      const space = figure.side === 'left' ? leftEdge - bounds.left : bounds.right - rightEdge
      // Keep at least sixteen pixels clear, with four extra pixels for
      // fractional layout coordinates and image-size rounding.
      const lane = space - 36
      if (lane < 100) continue
      const height = Math.min(
        availableHeight,
        Math.min(lane, 270 * prefs.artScale / 100) / figure.aspect,
        bounds.height * (phase === 'hero' ? figure.heroHeight : 0.76),
      )
      // A height-constrained narrow figure is independently hidden, without
      // suppressing the other pose when its lane can still accommodate it.
      if (height * figure.aspect < 100) continue
      candidates.push({ figure, height })
    }
    let sharedHeight: number | undefined
    if (reading && candidates.length === 2) {
      const lowerHeight = Math.min(...candidates.map(candidate => candidate.height))
      if (candidates.every(({ figure }) => lowerHeight * figure.aspect >= 100)) {
        sharedHeight = lowerHeight
      } else {
        // If equalizing would make one pose illegibly narrow, keep only the
        // other pose and preserve that single figure's own available height.
        candidates = candidates.filter(({ figure }) => lowerHeight * figure.aspect >= 100)
      }
    }
    for (const { figure, height } of candidates) {
      place(figure, sharedHeight ?? height, bottom, 16)
    }
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
  const onCharacterLoad = () => {
    if (character.currentSrc !== characterSource || character.naturalWidth === 0) return
    characterLoaded = true
    schedule()
  }
  const onCharacterError = () => { characterLoaded = false; stage.dataset.artVisible = 'false'; schedule() }
  const onCompanionLoad = () => { companionLoaded = true; schedule() }
  const onCompanionError = () => { companionLoaded = false; stage.dataset.companionVisible = 'false'; schedule() }
  character.addEventListener('load', onCharacterLoad)
  character.addEventListener('error', onCharacterError)
  companion.addEventListener('load', onCompanionLoad)
  companion.addEventListener('error', onCompanionError)
  character.src = characterSource
  companion.src = artwork.study
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
      character.removeEventListener('load', onCharacterLoad)
      character.removeEventListener('error', onCharacterError)
      companion.removeEventListener('load', onCompanionLoad)
      companion.removeEventListener('error', onCompanionError)
      stage.remove()
      body.dispose()
    },
  }
}
