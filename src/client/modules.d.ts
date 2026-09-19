declare module '*.css' { const css: string; export default css }
declare module 'asuka:art' {
  export const artwork: {
    front: string
    portrait: string
    day: string
    night: string
    frontAspect: number
  }
}
