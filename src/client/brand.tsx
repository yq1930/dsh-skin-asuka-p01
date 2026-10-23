import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { artwork } from 'asuka:art'
import type { AsukaPreferences } from '../preferences.ts'
import { bindForm } from './form.ts'

const LABEL = '明日香绯色天际'

/** Sidebar logo: the portrait in character mode, otherwise the unit number. */
export function createBrandMark(form: ConfigForm<AsukaPreferences>) {
  const useSaved = bindForm(form)
  return function BrandMark({ size }: SidebarBrandMarkOwnerProps) {
    const saved = useSaved()
    return saved.status === 'ready' && saved.value?.presentation === 'character'
      ? <img className="asuka-brand-image" src={artwork.portrait} alt={LABEL} width={size} height={size} draggable={false} />
      : <span className="asuka-brand-number" style={{ width: size, height: size, fontSize: Math.max(12, size * 0.58) }} aria-label={LABEL}>02</span>
  }
}

/** Welcome headline medallion. */
export function HeroMark() {
  return <span className="asuka-hero-emblem" role="img" aria-label={LABEL}><span>02</span></span>
}
