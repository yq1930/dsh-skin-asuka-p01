import { artwork } from 'asuka:art'
import { ornamentCssVariables } from './ornaments.ts'
import { paletteCss } from './palette.ts'
import tokens from './styles/tokens.css'
import stage from './styles/stage.css'
import reading from './styles/reading.css'
import composer from './styles/composer.css'
import hero from './styles/hero.css'
import brand from './styles/brand.css'
import settings from './styles/settings.css'
import chrome from './styles/chrome.css'

/** Artwork is published once on the skin scope; every surface refers to these names. */
const artworkCss = `body[data-dsh-asuka-p01]{${ornamentCssVariables}`
  + `--asuka-portrait-art:url("${artwork.portrait}");--asuka-ribbon-art:url("${artwork.ribbon}");`
  + `--asuka-scene-day:url("${artwork.day}");--asuka-scene-night:url("${artwork.night}");}`

/**
 * The whole skin stylesheet. Every rule is scoped to body[data-dsh-asuka-p01]; files
 * that style the same element (composer and hero ornaments) rely on this order.
 */
export const stylesheet = [paletteCss, tokens, stage, reading, composer, hero, brand, settings, chrome, artworkCss].join('\n')
