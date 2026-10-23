import { useSyncExternalStore } from 'react'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'

/** Bind a config form once, so every component subscribes with stable callbacks. */
export function bindForm<T>(form: ConfigForm<T>): () => ConfigFormSnapshot<T> {
  const subscribe = (listener: () => void) => form.subscribe(listener)
  const getSnapshot = () => form.getSnapshot()
  return () => useSyncExternalStore(subscribe, getSnapshot)
}
