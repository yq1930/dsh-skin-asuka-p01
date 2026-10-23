declare module '*.css' { const css: string; export default css }

/** Build-time artwork (scripts/build.mjs), embedded as WebP data URIs. */
declare module 'asuka:art' {
  interface Figure {
    src: string
    /** Width divided by height, after trimming transparent margins. */
    aspect: number
  }
  export const artwork: {
    /** 白衣立绘 */
    white: Figure
    /** 绯红立绘 */
    scarlet: Figure
    portrait: string
    day: string
    night: string
    ribbon: string
  }
}
