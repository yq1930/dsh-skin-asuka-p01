/** Own writes only; a later writer's value is never rolled back on disposal. */
export function ownedAttributes(element: HTMLElement) {
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
