import { useEffect, useRef, useState } from 'react'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { DEFAULT_PREFERENCES, PREFERENCE_KEYS, decodePreferences, samePreferences, type AsukaPreferences } from '../../preferences.ts'

/** Status-line text and whether it reports a failure. */
export interface Feedback {
  text: string
  error: boolean
}

/**
 * A local draft over the saved Host value. Edits stay local until saved; a newer
 * Host revision replaces a clean draft and marks a dirty one as conflicting.
 */
export function useSettingsDraft(form: ConfigForm<AsukaPreferences>, saved: ConfigFormSnapshot<AsukaPreferences>) {
  const [draft, setDraft] = useState<AsukaPreferences>(() => ({ ...(saved.value ?? DEFAULT_PREFERENCES) }))
  const [baseline, setBaseline] = useState<AsukaPreferences>(() => ({ ...(saved.value ?? DEFAULT_PREFERENCES) }))
  const [revision, setRevision] = useState<number | undefined>(saved.status === 'ready' && saved.value ? saved.revision : undefined)
  const [reset, setReset] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>({ text: '', error: false })
  const [slow, setSlow] = useState(false)
  const busy = useRef(false)
  const alive = useRef(true)
  const dirty = reset || !samePreferences(draft, baseline)
  const ready = saved.status === 'ready' && !!saved.value
  const initialized = revision !== undefined
  const writable = ready && initialized && saved.writable && saved.mode === 'host'
  const conflict = revision !== undefined && saved.revision !== revision && dirty && !saving

  const notify = (text: string, error = false) => setFeedback({ text, error })
  function adopt(value: AsukaPreferences, nextRevision: number | undefined) {
    setDraft({ ...value }); setBaseline({ ...value }); setRevision(nextRevision)
  }

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  // Follow the saved value while the draft has nothing local to lose.
  useEffect(() => {
    if (saved.value && (revision === undefined || (!dirty && (saved.revision !== revision || !samePreferences(saved.value, baseline))))) {
      adopt(saved.value, saved.revision)
    }
  }, [saved, dirty, revision, baseline])
  useEffect(() => {
    setSlow(false)
    if (saved.status !== 'loading') return
    const timer = window.setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(timer)
  }, [saved.status])

  function change<K extends keyof AsukaPreferences>(key: K, value: AsukaPreferences[K]) {
    setDraft(current => ({ ...current, [key]: value })); setReset(false); notify('')
  }
  function reload() {
    const current = form.getSnapshot()
    if (!current.value) return
    adopt(current.value, current.revision); setReset(false); notify('已重新载入当前保存值。')
  }
  function restoreDefaults() {
    setDraft(decodePreferences(saved.base) ?? { ...DEFAULT_PREFERENCES }); setReset(true); notify('已恢复默认草稿，保存后生效。')
  }
  async function save() {
    if (busy.current || !writable || !dirty || conflict || revision === undefined) return
    const target = decodePreferences(draft)
    if (!target) { notify('设置值不合法，请重新调整。', true); return }
    busy.current = true; setSaving(true); notify('正在保存…')
    const timer = window.setTimeout(() => {
      if (alive.current) notify('保存结果尚未确认，请等待连接恢复；重复提交已暂时禁用。')
    }, 8000)
    try {
      const ops = reset
        ? PREFERENCE_KEYS.map(key => ({ op: 'unset' as const, path: [key] }))
        : PREFERENCE_KEYS.map(key => ({ op: 'set' as const, path: [key], value: target[key] }))
      const acceptedWrite = await form.mutate(ops, revision)
      if (!alive.current) return
      if (!acceptedWrite) throw new Error('宿主未接受本次修改，请重新载入有效设置后再试')
      const accepted = form.getSnapshot()
      if (!accepted.value || accepted.status !== 'ready' || accepted.mode !== 'host') throw new Error('Host尚未返回可确认的持久化设置。')
      // Confirm the authoritative result before replacing the user's unsaved draft.
      const user = accepted.user
      const resetStillOverridden = reset && user !== null && typeof user === 'object'
        && PREFERENCE_KEYS.some(key => Object.hasOwn(user, key))
      if (!samePreferences(accepted.value, target) || resetStillOverridden) throw new Error('宿主未接受本次草稿，设置可能已在其他窗口改变')
      adopt(accepted.value, accepted.revision); setReset(false); notify('设置已保存。')
    } catch (cause) {
      if (alive.current) notify(`未能确认保存：${cause instanceof Error ? cause.message : '连接或设置冲突'}。草稿已保留，可重新载入后再试。`, true)
    } finally {
      clearTimeout(timer); busy.current = false
      if (alive.current) setSaving(false)
    }
  }

  return { draft, dirty, ready, initialized, writable, conflict, saving, slow, feedback, change, reload, restoreDefaults, save }
}
