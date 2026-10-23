import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'

/**
 * One color role. `dark` replaces `light` under the host's dark theme and `forced`
 * maps the role to a system color in forced-colors mode; roles without them keep
 * their light value.
 */
interface Swatch {
  readonly light: string
  readonly dark?: string
  readonly forced?: string
}

/** Every named skin color, published as `--asuka-<role>` on the skin's body scope. */
const PALETTE = {
  'chrome': { light: '#23171c' },
  'chrome-raised': { light: '#3c202a' },
  'chrome-text': { light: '#fff1de' },
  'chrome-muted': { light: '#d7bbaa' },
  'copper': { light: '#bd9060' },
  'ruby': { light: '#a83337' },
  'gold-light': { light: '#f4daa4' },
  'velvet-glow': { light: '#592433' },
  'ivory-button': { light: '#fff5e4' },
  'ivory-button-ink': { light: '#512733' },
  'base': { light: '#f1ebe5', dark: '#171b29', forced: 'Canvas' },
  'panel': { light: '#fffbf6', dark: '#26232e', forced: 'Canvas' },
  'raised': { light: '#f1e4d9', dark: '#342c33', forced: 'Canvas' },
  'overlay': { light: '#fffdf9', dark: '#42323b', forced: 'Canvas' },
  'code': { light: '#f3ede4', dark: '#1e202c', forced: 'Canvas' },
  'text': { light: '#30272a', dark: '#f6eada', forced: 'CanvasText' },
  'secondary': { light: '#6b5e58', dark: '#e2cfc5', forced: 'CanvasText' },
  'muted': { light: '#6f6063', dark: '#c9b6af', forced: 'GrayText' },
  'diff-add': { light: '#21633e', dark: '#8bd5a5', forced: 'CanvasText' },
  'diff-delete': { light: '#a33339', dark: '#ffada8', forced: 'CanvasText' },
  'primary': { light: '#a83337', forced: 'Highlight' },
  'primary-hover': { light: '#8b292d', forced: 'Highlight' },
  'on-primary': { light: '#ffffff', forced: 'HighlightText' },
  'link': { light: '#88413e', dark: '#ffc4a4', forced: 'LinkText' },
  'border': { light: '#d8c1a6', dark: '#68524e', forced: 'ButtonBorder' },
  'control': { light: '#9d7e70', dark: '#aa8474', forced: 'ButtonBorder' },
  'selected': { light: '#f3dad1', dark: '#4b2c33', forced: 'Canvas' },
  'error': { light: '#b33535', dark: '#ffada8', forced: 'CanvasText' },
  'notice': { light: '#895900', dark: '#f1c57a', forced: 'CanvasText' },
} as const satisfies Record<string, Swatch>

type Role = keyof typeof PALETTE

/** Host `--dsw-*` tokens re-pointed at skin roles, as CSS fallback and as the theme layer. */
const HOST_TOKENS = {
  '--dsw-alias-bg-base': 'base',
  '--dsw-alias-bg-layer-1': 'panel',
  '--dsw-alias-bg-layer-2': 'raised',
  '--dsw-alias-bg-layer-3': 'overlay',
  '--dsw-alias-bg-overlay': 'overlay',
  '--dsw-alias-bg-module-platform': 'panel',
  '--dsw-alias-border-l1': 'border',
  '--dsw-alias-border-l2-darkmode-thin': 'border',
  '--dsw-alias-border-l2': 'control',
  '--dsw-alias-border-l3': 'control',
  '--dsw-alias-border-l4': 'control',
  '--dsw-alias-brand-primary': 'primary',
  '--dsw-alias-brand-text': 'text',
  '--dsw-alias-button-elevated-fill': 'panel',
  '--dsw-alias-button-floating-fill': 'overlay',
  '--dsw-alias-button-floating-hover': 'raised',
  '--dsw-alias-button-info-fill': 'primary',
  '--dsw-alias-button-info-hover': 'primary-hover',
  '--dsw-alias-interactive-bg-active': 'selected',
  '--dsw-alias-interactive-bg-hover': 'raised',
  '--dsw-alias-interactive-bg-hover-solid': 'raised',
  '--dsw-alias-label-primary': 'text',
  '--dsw-alias-label-primary-bluish': 'link',
  '--dsw-alias-label-secondary': 'secondary',
  '--dsw-alias-label-tertiary': 'muted',
  '--dsw-alias-label-caption': 'muted',
  '--dsw-alias-label-primary-dimmed': 'secondary',
  '--dsw-alias-label-dimmed': 'muted',
  '--dsw-alias-label-primary-foreground': 'on-primary',
  '--dsw-alias-label-primary-inverted': 'panel',
  '--dsw-alias-state-business-primary': 'link',
  '--dsw-alias-state-business-tertiary': 'raised',
  '--dsw-alias-markdown-code-block': 'code',
  '--dsw-alias-scrollbar-bg-l2': 'control',
  '--dsw-alias-scrollbar-hover-l2': 'secondary',
  '--dsw-specific-input-major': 'panel',
  '--dsw-specific-menu': 'overlay',
  '--dsw-specific-selector': 'raised',
  '--dsw-specific-sidebar-fill': 'base',
  '--dsw-specific-sidebar-nav-item-active-accent': 'primary',
} as const satisfies Record<string, Role>

const SCOPE = 'body[data-dsh-asuka-p01]'
const roles = Object.entries(PALETTE) as [Role, Swatch][]

function block(selector: string, declarations: [string, string | undefined][]) {
  return `${selector}{${declarations.filter(([, value]) => value).map(([name, value]) => `${name}:${value};`).join('')}}`
}

/** Light roles with the host aliases, then the dark and forced-colors overrides. */
export const paletteCss = [
  block(SCOPE, [
    ...roles.map(([role, swatch]): [string, string] => [`--asuka-${role}`, swatch.light]),
    ...Object.entries(HOST_TOKENS).map(([token, role]): [string, string] => [token, `var(--asuka-${role})`]),
  ]),
  block(`${SCOPE}[data-ds-dark-theme]`, roles.map(([role, swatch]) => [`--asuka-${role}`, swatch.dark])),
  `@media (forced-colors: active){${block(`${SCOPE},${SCOPE}[data-ds-dark-theme]`, roles.map(([role, swatch]) => [`--asuka-${role}`, swatch.forced]))}}`,
].join('\n')

/** The same aliases as an official theme layer, resolved to literal light/dark values. */
export function hostTokenLayer(): ThemeTokenOverrides {
  return Object.fromEntries(Object.entries(HOST_TOKENS).map(([token, role]) => {
    const swatch: Swatch = PALETTE[role]
    return [token, { light: swatch.light, dark: swatch.dark ?? swatch.light }]
  }))
}
