import type { Side } from '../../preferences.ts'

/** The rectangle fields the layout reads; DOMRect satisfies it. */
export interface Box {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

/** Names the figure's CSS variables: --asuka-<key>-left/width/height/bottom. */
export type FigureKey = 'art' | 'companion'

export interface Figure {
  key: FigureKey
  side: Side
  /** Image width divided by height. */
  aspect: number
  /** Welcome-page height as a share of the column height. */
  heroHeight: number
}

/** Column-relative geometry in CSS pixels, before rounding. */
export interface Placement {
  key: FigureKey
  left: number
  width: number
  height: number
  bottom: number
}

export interface StageMetrics {
  column: Box
  /** The host phase root's data-phase. */
  phase: string | undefined
  /** Reading flow and composer card rectangles that figures must not cover. */
  content: readonly Box[]
  /** Composer card and seat rectangles; figures stand above their visible top. */
  composer: readonly Box[]
  /** Loaded figures only. */
  figures: readonly Figure[]
  /** Character size preference in percent. */
  artScale: number
}

/**
 * Place each figure into space the reading column leaves free. A figure that would
 * cover live content, or become illegibly small, is left out.
 */
export function layoutFigures({ column, phase, content, composer, figures, artScale }: StageMetrics): Placement[] {
  const occupied = content.filter(r => r.width > 40 && r.height > 0 && r.right > column.left && r.left < column.right)
  // Unknown markup falls back to colors/avatar, without guessing over live controls.
  if (!occupied.length || column.width < 700 || column.height < 380) return []
  const reading = phase === 'active' || phase === 'settling'
  const place = (figure: Figure, height: number, bottom: number, inset: number): Placement => {
    const width = height * figure.aspect
    return { key: figure.key, left: figure.side === 'left' ? inset : column.width - width - inset, width, height, bottom }
  }

  // These are two distinct poses, never a mirrored copy. The welcome figures
  // may extend behind the opaque input card, but leave the top frame clear.
  if (phase === 'hero' && column.width >= 1000 && column.height >= 600) {
    return figures.map(figure => place(figure, Math.min(
      column.height * figure.heroHeight * artScale / 100,
      column.height - 90,
      column.width * 0.34 / figure.aspect,
    ), 20, 20))
  }
  // A narrow reading column keeps its space for text rather than miniature figures.
  if (reading && column.width < 900) return []

  // Active input/metadata share an opaque seat. Keep both figures' feet above
  // its visible top, even when the input card itself is lower or grows taller.
  const seats = composer.filter(r => r.width > 0 && r.height > 0 && r.bottom > column.top && r.top < column.bottom)
  const bottom = phase !== 'hero' && seats.length
    ? Math.max(0, column.bottom - Math.min(...seats.map(r => r.top)) + 16) : 20
  const availableHeight = column.height - bottom - 70
  if (availableHeight < 220) return []

  const leftEdge = Math.max(column.left, Math.min(...occupied.map(r => r.left)))
  const rightEdge = Math.min(column.right, Math.max(...occupied.map(r => r.right)))
  let candidates = figures.flatMap(figure => {
    const space = figure.side === 'left' ? leftEdge - column.left : column.right - rightEdge
    // Keep at least sixteen pixels clear, with four extra pixels for
    // fractional layout coordinates and image-size rounding.
    const lane = space - 36
    if (lane < 100) return []
    const height = Math.min(
      availableHeight,
      Math.min(lane, 270 * artScale / 100) / figure.aspect,
      column.height * (phase === 'hero' ? figure.heroHeight : 0.5),
      reading ? 420 * artScale / 100 : Infinity,
    )
    // A height-constrained narrow figure is independently hidden, without
    // suppressing the other pose when its lane can still accommodate it.
    if (height * figure.aspect < 100 || (reading && height < 280 * artScale / 100)) return []
    return [{ figure, height }]
  })

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
  return candidates.map(({ figure, height }) => place(figure, sharedHeight ?? height, bottom, 16))
}
