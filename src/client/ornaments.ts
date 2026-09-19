/** Original, resolution-independent metalwork. No remote assets or third-party artwork. */
const gold = `<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0c4"/><stop offset=".28" stop-color="#d8ad69"/><stop offset=".52" stop-color="#fff0c4"/><stop offset=".76" stop-color="#a46d38"/><stop offset="1" stop-color="#eacb8c"/></linearGradient><linearGradient id="wine" x2="0" y2="1"><stop stop-color="#8d3443"/><stop offset=".5" stop-color="#58222e"/><stop offset="1" stop-color="#351721"/></linearGradient></defs>`

function uri(width: number, height: number, content: string) {
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${gold}${content}</svg>`)}")`
}

const cornerDrawing = `<g fill="none" stroke="url(#gold)" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 92V23Q4 4 23 4H92M12 80V29Q12 12 29 12H80" stroke-width="1.3"/>
  <path d="M8 55C24 52 16 29 32 24C45 19 55 26 49 38C43 50 25 42 31 32C34 27 41 30 40 34M55 8C52 24 29 16 24 32C19 45 26 55 38 49C50 43 42 25 32 31" stroke-width="1.55"/>
  <path d="M7 73C19 70 25 60 21 51C19 46 13 49 15 54C19 61 35 58 38 47M73 7C70 19 60 25 51 21C46 19 49 13 54 15C61 19 58 35 47 38" stroke-width="1.15"/>
  <path d="M17 20C28 17 34 9 32 5M20 17C17 28 9 34 5 32M29 62C34 59 37 52 37 47M62 29C59 34 52 37 47 37"/>
  <path d="M12 12L19 7L25 13L18 20Z" fill="#ead099" stroke-width=".7"/>
  <path d="M41 12Q46 6 51 8Q49 15 41 12M12 41Q6 46 8 51Q15 49 12 41M24 60Q20 65 24 70Q30 65 24 60M60 24Q65 20 70 24Q65 30 60 24" fill="url(#gold)" stroke-width=".6"/>
  <circle cx="58" cy="7" r="1.7" fill="#f9e6b0"/><circle cx="7" cy="58" r="1.7" fill="#f9e6b0"/>
  <path d="M7 83L10 87L7 91L4 87Z M83 7L87 4L91 7L87 10Z" fill="#ca9c60" stroke-width=".5"/>
</g>`

const corner = (angle: number) => uri(96, 96, `<g transform="rotate(${angle} 48 48)">${cornerDrawing}</g>`)
const trim = uri(72, 24, `<g fill="none" stroke="url(#gold)" stroke-width=".8">
  <path d="M0 2H72M0 5H72M0 8Q9 26 18 8Q27 26 36 8Q45 26 54 8Q63 26 72 8"/>
  <path d="M0 8Q9 19 18 8Q27 19 36 8Q45 19 54 8Q63 19 72 8"/>
  <path d="M9 10L12 14L9 18L6 14Z M27 10L30 14L27 18L24 14Z M45 10L48 14L45 18L42 14Z M63 10L66 14L63 18L60 14Z" fill="#d6b674"/>
  <path d="M0 5L9 10L18 5L27 10L36 5L45 10L54 5L63 10L72 5"/>
  <g fill="#fff2cc"><circle cx="0" cy="8" r="1.2"/><circle cx="18" cy="8" r="1.2"/><circle cx="36" cy="8" r="1.2"/><circle cx="54" cy="8" r="1.2"/><circle cx="72" cy="8" r="1.2"/></g>
</g>`)

const medallion = uri(220, 244, `<g fill="none" stroke="url(#gold)" stroke-linecap="round">
  <ellipse cx="110" cy="112" rx="68" ry="92" stroke-width="1.6"/><ellipse cx="110" cy="112" rx="63" ry="86" stroke-width=".65"/>
  <path d="M110 13C96 4 95 23 84 22C74 21 84 10 90 15M110 13C124 4 125 23 136 22C146 21 136 10 130 15M110 211C96 223 91 209 84 214C79 218 87 225 93 220M110 211C124 223 129 209 136 214C141 218 133 225 127 220" stroke-width="1.7"/>
  <path d="M40 75C17 88 42 100 31 116C18 134 30 154 42 146M180 75C203 88 178 100 189 116C202 134 190 154 178 146M43 152C39 175 53 187 64 185M177 152C181 175 167 187 156 185" stroke-width="1.5"/>
  <path d="M33 104C18 97 20 87 31 88C37 89 39 96 33 104M33 121C15 125 18 139 31 134C35 132 37 126 33 121M187 104C202 97 200 87 189 88C183 89 181 96 187 104M187 121C205 125 202 139 189 134C185 132 183 126 187 121" stroke-width="1.1"/>
  <path d="M110 1L117 12L110 25L103 12Z M110 206L116 215L110 231L104 215Z" fill="#982e43" stroke-width="1.4"/>
  <path d="M47 58Q31 52 38 44Q48 42 47 58M173 58Q189 52 182 44Q172 42 173 58M56 184Q42 190 49 198Q59 197 56 184M164 184Q178 190 171 198Q161 197 164 184" fill="url(#gold)" stroke-width=".5"/>
  <g fill="#efd5a0"><circle cx="28" cy="112" r="2"/><circle cx="192" cy="112" r="2"/><circle cx="110" cy="237" r="2"/></g>
</g>`)

const flourish = uri(320, 54, `<g fill="none" stroke="url(#gold)" stroke-linecap="round">
  <path d="M3 29H106M214 29H317M20 33H98M222 33H300" stroke-width=".75"/>
  <path d="M160 28C138 3 116 11 119 25C121 37 138 34 135 24C133 19 127 22 129 26M160 28C182 3 204 11 201 25C199 37 182 34 185 24C187 19 193 22 191 26M149 28C128 46 111 31 103 29M171 28C192 46 209 31 217 29" stroke-width="1.35"/>
  <path d="M160 10L170 27L160 45L150 27Z" fill="url(#wine)" stroke-width="1.5"/>
  <path d="M160 17L165 27L160 37L155 27Z" fill="#ca5661" stroke-width=".6"/>
  <path d="M142 13Q132 3 127 9Q130 16 142 13M178 13Q188 3 193 9Q190 16 178 13" fill="url(#gold)" stroke-width=".6"/>
  <circle cx="109" cy="29" r="1.8" fill="#f5dfa8"/><circle cx="211" cy="29" r="1.8" fill="#f5dfa8"/>
</g>`)

const plaque = uri(300, 68, `<g fill="none" stroke="url(#gold)">
  <path d="M21 5H279Q279 16 294 16V52Q279 52 279 63H21Q21 52 6 52V16Q21 16 21 5Z" stroke-width="1.2"/>
  <path d="M25 10H275Q275 21 289 21V47Q275 47 275 58H25Q25 47 11 47V21Q25 21 25 10Z" stroke-width=".65"/>
  <path d="M25 5Q16 1 16 10Q16 16 9 13M275 5Q284 1 284 10Q284 16 291 13M25 63Q16 67 16 58Q16 52 9 55M275 63Q284 67 284 58Q284 52 291 55" stroke-width="1.1"/>
  <path d="M1 29L5 34L1 39 M299 29L295 34L299 39" stroke-width="1.3"/>
  <circle cx="27" cy="15" r="1" fill="#efd5a0"/><circle cx="273" cy="15" r="1" fill="#efd5a0"/><circle cx="27" cy="53" r="1" fill="#efd5a0"/><circle cx="273" cy="53" r="1" fill="#efd5a0"/>
</g>`)

export const ornamentCssVariables = [
  `--asuka-corner-art:${corner(0)}`,
  `--asuka-corner-tl-art:${corner(0)}`,
  `--asuka-corner-tr-art:${corner(90)}`,
  `--asuka-corner-br-art:${corner(180)}`,
  `--asuka-corner-bl-art:${corner(270)}`,
  `--asuka-trim-art:${trim}`,
  `--asuka-medallion-art:${medallion}`,
  `--asuka-flourish-art:${flourish}`,
  `--asuka-plaque-art:${plaque}`,
].join(';') + ';'
