import { artwork } from 'asuka:art'
import type { AsukaPreferences } from '../../preferences.ts'
import { ownedAttributes } from './attributes.ts'
import { layoutFigures, type FigureKey } from './layout.ts'

const COLUMN = ":is([data-pane='conversation'], [class*='centerCol'])"
const PHASE = '[data-phase="hero"], [data-phase="active"], [data-phase="settling"]'
const CONTENT = '[data-composer-card], [data-chat-flow]'
const COMPOSER = '[data-composer-card], [data-composer-seat]'

interface FigureSpec {
  key: FigureKey
  className: string
  art: { src: string; aspect: number }
  /** The primary pose stands on the preferred side, the companion opposite it. */
  primary: boolean
  heroHeight: number
}

const FIGURES: readonly FigureSpec[] = [
  { key: 'art', className: 'asuka-stage__character', art: artwork.white, primary: true, heroHeight: 0.80 },
  { key: 'companion', className: 'asuka-stage__companion', art: artwork.scarlet, primary: false, heroHeight: 0.78 },
]

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string) {
  const node = document.createElement(tag)
  node.className = className
  return node
}

/** The DOM adapter is limited to the tested Harness conversation-column markers. */
export function installScene() {
  const body = ownedAttributes(document.body)
  body.set('data-dsh-asuka-p01', '')
  body.set('data-asuka-mode', 'focus')
  body.set('data-asuka-background', 'false')

  const stage = element('div', 'asuka-stage')
  stage.dataset.skinOwner = 'asuka-p01'
  stage.dataset.phase = 'unknown'
  stage.dataset.artVisible = 'false'
  stage.dataset.companionVisible = 'false'
  stage.setAttribute('aria-hidden', 'true')
  const figures = FIGURES.map(spec => {
    const image = element('img', spec.className)
    image.alt = ''
    image.draggable = false
    return { ...spec, image, loaded: false }
  })
  const mark = element('span', 'asuka-stage__mark')
  mark.textContent = 'ASUKA / SKYLINE'
  stage.append(element('div', 'asuka-stage__background'), element('div', 'asuka-stage__frame'), ...figures.map(f => f.image), mark)

  let prefs: AsukaPreferences | undefined
  let column: HTMLElement | null = null
  let columnAttributes: ReturnType<typeof ownedAttributes> | undefined
  let stopped = false
  let frame = 0
  const schedule = () => {
    if (!stopped && !frame) frame = requestAnimationFrame(refresh)
  }
  const resize = new ResizeObserver(schedule)
  const resizeTargets = new Set<HTMLElement>()
  // Input height and reading-panel width can change without resizing the column.
  // Reconcile targets on every refresh so replaced conversation nodes are released.
  const observeSizes = (targets: HTMLElement[]) => {
    const next = new Set(targets)
    for (const target of resizeTargets) {
      if (next.has(target)) continue
      resize.unobserve(target)
      resizeTargets.delete(target)
    }
    for (const target of next) {
      if (resizeTargets.has(target)) continue
      resize.observe(target)
      resizeTargets.add(target)
    }
  }
  const setSize = (name: string, value: number) => {
    const next = `${Math.round(value)}px`
    if (stage.style.getPropertyValue(name) !== next) stage.style.setProperty(name, next)
  }

  function refresh() {
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
        columnAttributes = ownedAttributes(column)
        column.prepend(stage)
      } else stage.remove()
    } else if (column && stage.parentElement !== column) column.prepend(stage)
    stage.dataset.artVisible = 'false'
    stage.dataset.companionVisible = 'false'
    if (!column) return

    const bounds = column.getBoundingClientRect()
    columnAttributes?.set('data-asuka-density', bounds.width >= 1100 ? 'normal' : bounds.width >= 850 ? 'compact' : 'narrow')
    const host = [...column.querySelectorAll<HTMLElement>(PHASE)].find(el => el !== stage && !stage.contains(el))
    const content = host ? [...host.querySelectorAll<HTMLElement>(CONTENT)] : []
    const seats = host ? [...host.querySelectorAll<HTMLElement>('[data-composer-seat]')] : []
    observeSizes([column, ...content, ...seats])
    const phase = host?.dataset.phase
    stage.dataset.phase = phase === 'hero' ? 'hero' : phase === 'active' || phase === 'settling' ? 'active' : 'unknown'
    if (!prefs || prefs.presentation === 'focus' || !host) return

    const { side, artScale } = prefs
    const opposite = side === 'left' ? 'right' : 'left'
    const placements = layoutFigures({
      column: bounds,
      phase,
      content: content.map(el => el.getBoundingClientRect()),
      composer: [...host.querySelectorAll<HTMLElement>(COMPOSER)].map(el => el.getBoundingClientRect()),
      figures: figures.filter(figure => figure.loaded).map(figure => ({
        key: figure.key,
        side: figure.primary ? side : opposite,
        aspect: figure.art.aspect,
        heroHeight: figure.heroHeight,
      })),
      artScale,
    })
    for (const placement of placements) {
      setSize(`--asuka-${placement.key}-left`, placement.left)
      setSize(`--asuka-${placement.key}-width`, placement.width)
      setSize(`--asuka-${placement.key}-height`, placement.height)
      setSize(`--asuka-${placement.key}-bottom`, placement.bottom)
      stage.dataset[`${placement.key}Visible`] = 'true'
    }
  }

  const mutations = new MutationObserver(records => {
    if (records.some(record => record.target !== stage && !stage.contains(record.target))) schedule()
  })
  mutations.observe(document.body, { subtree: true, childList: true, attributes: true,
    attributeFilter: ['data-phase', 'data-content-phase', 'class', 'style'] })
  window.addEventListener('resize', schedule)
  const listeners = figures.map(figure => {
    const load = () => {
      if (figure.image.naturalWidth === 0) return
      figure.loaded = true
      schedule()
    }
    const error = () => {
      figure.loaded = false
      stage.dataset[`${figure.key}Visible`] = 'false'
      schedule()
    }
    figure.image.addEventListener('load', load)
    figure.image.addEventListener('error', error)
    return () => {
      figure.image.removeEventListener('load', load)
      figure.image.removeEventListener('error', error)
    }
  })
  for (const figure of figures) figure.image.src = figure.art.src
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
      for (const remove of listeners) remove()
      stage.remove()
      body.dispose()
    },
  }
}
