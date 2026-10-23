import type { CSSProperties } from 'react'
import { artwork } from 'asuka:art'
import type { AsukaPreferences } from '../../preferences.ts'

export type PreviewPhase = 'hero' | 'active'

/** Mirrors the stage: the white pose takes the preferred side, the scarlet one the other. */
const FIGURES = [
  { art: artwork.white, alt: '明日香白衣立绘', primary: true, width: '46%', heroHeight: 80, maxHeight: 94 },
  { art: artwork.scarlet, alt: '明日香绯红立绘', primary: false, width: '44%', heroHeight: 78, maxHeight: 92 },
]

/** Draft preview, applied by the stage only after saving. */
export function SettingsPreview({ draft, phase }: { draft: AsukaPreferences; phase: PreviewPhase }) {
  const character = draft.presentation === 'character'
  const opposite = draft.side === 'left' ? 'right' : 'left'
  return <div className="asuka-settings__preview" style={{ '--asuka-scene-opacity': draft.intensity / 100 } as CSSProperties}
    data-preview-phase={phase} data-preview-mode={draft.presentation} aria-label="当前草稿预览">
    {draft.background && character && <div className="asuka-settings__preview-scene" aria-hidden="true" />}
    {character
      ? FIGURES.map(figure => <img key={figure.alt} src={figure.art.src} alt={figure.alt} style={{
        height: `${Math.min(figure.maxHeight, (phase === 'hero' ? figure.heroHeight : 50) * draft.artScale / 100)}%`,
        width: figure.width,
        [figure.primary ? draft.side : opposite]: 0,
      }} />)
      : phase === 'hero' && <div className="asuka-settings__preview-badge"><span className="asuka-brand-number">02</span></div>}
    {phase === 'active' && <div className="asuka-settings__preview-reading" aria-hidden="true">独立回复卡片</div>}
  </div>
}
