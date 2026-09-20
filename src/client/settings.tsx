import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import { artwork } from 'asuka:art'
import { DEFAULT_PREFERENCES, PREFERENCE_KEYS, samePreferences, decodePreferences, type AsukaPreferences } from '../preferences.ts'

export function createSettingsPage(scope: SettingsScope<AsukaPreferences>) {
  const subscribe = (listener: () => void) => scope.subscribe(listener)
  const snapshot = () => scope.getSnapshot()
  return function AsukaSettings({ close }: { close: () => void }) {
    const saved = useSyncExternalStore(subscribe, snapshot)
    const [draft, setDraft] = useState<AsukaPreferences>(() => ({ ...(saved.value ?? DEFAULT_PREFERENCES) }))
    const [baseline, setBaseline] = useState<AsukaPreferences>(() => ({ ...(saved.value ?? DEFAULT_PREFERENCES) }))
    const [revision, setRevision] = useState<number | undefined>(saved.status === 'ready' && saved.value ? saved.revision : undefined)
    const [reset, setReset] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState(false)
    const [slow, setSlow] = useState(false)
    const [previewPhase, setPreviewPhase] = useState<'hero' | 'active'>('active')
    const busy = useRef(false)
    const alive = useRef(true)
    const dirty = reset || !samePreferences(draft, baseline)
    const ready = saved.status === 'ready' && !!saved.value
    const initialized = revision !== undefined
    const writable = ready && initialized && saved.writable && saved.mode === 'host'
    const conflict = revision !== undefined && saved.revision !== revision && dirty && !saving

    useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
    useEffect(() => {
      if (saved.value && (revision === undefined || (!dirty && (saved.revision !== revision || !samePreferences(saved.value, baseline))))) {
        setDraft({ ...saved.value }); setBaseline({ ...saved.value }); setRevision(saved.revision)
      }
    }, [saved, dirty, revision, baseline])
    useEffect(() => {
      setSlow(false)
      if (saved.status !== 'loading') return
      const timer = window.setTimeout(() => setSlow(true), 5000)
      return () => clearTimeout(timer)
    }, [saved.status])

    function change<K extends keyof AsukaPreferences>(key: K, value: AsukaPreferences[K]) {
      setDraft(current => ({ ...current, [key]: value })); setReset(false); setMessage(''); setError(false)
    }
    function reloadDraft() {
      const current = scope.getSnapshot()
      if (!current.value) return
      setDraft({ ...current.value }); setBaseline({ ...current.value }); setRevision(current.revision)
      setReset(false); setMessage('已重新载入当前保存值。'); setError(false)
    }
    async function save() {
      if (busy.current || !writable || !dirty || conflict || revision === undefined) return
      const target = decodePreferences(draft)
      if (!target) { setError(true); setMessage('设置值不合法，请重新调整。'); return }
      busy.current = true; setSaving(true); setError(false); setMessage('正在保存…')
      const timer = window.setTimeout(() => {
        if (alive.current) setMessage('保存结果尚未确认，请等待连接恢复；重复提交已暂时禁用。')
      }, 8000)
      try {
        const ops = reset
          ? PREFERENCE_KEYS.map(key => ({ op: 'unset' as const, path: [key] }))
          : PREFERENCE_KEYS.map(key => ({ op: 'set' as const, path: [key], value: target[key] }))
        await scope.mutate(ops, revision)
        if (!alive.current) return
        const accepted = scope.getSnapshot()
        if (!accepted.value || accepted.status !== 'ready' || accepted.mode !== 'host') throw new Error('Host尚未返回可确认的持久化设置。')
        // mutate() also resolves after a rejected Host write has recovered its snapshot.
        // Confirm the authoritative result before replacing the user's unsaved draft.
        const resetStillOverridden = reset && accepted.user !== null && typeof accepted.user === 'object'
          && PREFERENCE_KEYS.some(key => Object.prototype.hasOwnProperty.call(accepted.user, key))
        if (!samePreferences(accepted.value, target) || resetStillOverridden) throw new Error('宿主未接受本次草稿，设置可能已在其他窗口改变')
        setDraft({ ...accepted.value }); setBaseline({ ...accepted.value }); setRevision(accepted.revision)
        setReset(false); setMessage('设置已保存。')
      } catch (cause) {
        if (alive.current) {
          setError(true)
          setMessage(`未能确认保存：${cause instanceof Error ? cause.message : '连接或设置冲突'}。草稿已保留，可重新载入后再试。`)
        }
      } finally {
        clearTimeout(timer); busy.current = false
        if (alive.current) setSaving(false)
      }
    }
    const previewStyle = { position: 'relative', '--asuka-preview-day': `url("${artwork.day}")`, '--asuka-preview-night': `url("${artwork.night}")`, '--asuka-scene-opacity': draft.intensity / 100 } as CSSProperties
    return <section className="asuka-settings" aria-label="明日香 P01 主题设置">
      <header className="asuka-settings__header">
        <h2>明日香 · 绯色天际</h2>
        <p>精绘双立绘、城市穹顶与日夜光影。明暗外观沿用宿主设置。</p>
      </header>
      <div>
        <div className="asuka-settings__preview-tabs" role="group" aria-label="预览场景">
          <button type="button" aria-pressed={previewPhase === 'hero'} onClick={() => setPreviewPhase('hero')}>欢迎页</button>
          <button type="button" aria-pressed={previewPhase === 'active'} onClick={() => setPreviewPhase('active')}>会话阅读</button>
        </div>
        <div className="asuka-settings__preview" style={previewStyle} data-preview-phase={previewPhase} data-preview-side={draft.side} data-preview-mode={draft.presentation} aria-label="当前草稿预览">
          {draft.background && draft.presentation === 'character' && <div className="asuka-settings__preview-scene" aria-hidden="true" />}
          {draft.presentation === 'character' ? <>
            <img src={previewPhase === 'hero' ? artwork.welcome : artwork.front} alt="明日香白衣立绘" style={{ objectFit: 'contain', height: `${Math.min(98, 90 * draft.artScale / 100)}%`, width: '46%', position: 'absolute', bottom: 0, [draft.side]: 0 }} />
            <img src={artwork.study} alt="明日香绯红立绘" style={{ objectFit: 'contain', height: `${Math.min(96, 86 * draft.artScale / 100)}%`, width: '44%', position: 'absolute', bottom: 0, [draft.side === 'left' ? 'right' : 'left']: 0 }} />
          </> : previewPhase === 'hero' ? <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}><span className="asuka-brand-number">02</span></div> : null}
          {previewPhase === 'active' && <div className="asuka-settings__preview-reading" aria-hidden="true">独立回复卡片</div>}
        </div>
        <p className="asuka-settings__notice">两套精绘形象共享同一画风；会话中按两侧空间缩放。此处为草稿示意，保存后应用。</p>
      </div>
      <div className="asuka-settings__controls">
        <label className="asuka-settings__field">表现方式<select value={draft.presentation} disabled={!writable || saving} onChange={e => change('presentation', e.target.value as AsukaPreferences['presentation'])}><option value="character">角色模式</option><option value="focus">专注模式</option></select></label>
        <label className="asuka-settings__field"><input type="checkbox" checked={draft.background} disabled={!writable || saving || draft.presentation === 'focus'} onChange={e => change('background', e.target.checked)} />显示穹顶背景</label>
        <label className="asuka-settings__field">主立绘位置<select value={draft.side} disabled={!writable || saving || draft.presentation === 'focus'} onChange={e => change('side', e.target.value as AsukaPreferences['side'])}><option value="left">白衣在左，绯红在右</option><option value="right">白衣在右，绯红在左</option></select></label>
        <label className="asuka-settings__field">背景强度 <output>{draft.intensity}%</output><input type="range" min="0" max="100" step="1" value={draft.intensity} disabled={!writable || saving || !draft.background || draft.presentation === 'focus'} onChange={e => change('intensity', Number(e.target.value))} /><small>欢迎页使用此强度；会话中自动降为其40%，正文保持实色底。</small></label>
        <label className="asuka-settings__field">人物大小 <output>{draft.artScale}%</output><input type="range" min="60" max="120" step="1" value={draft.artScale} disabled={!writable || saving || draft.presentation === 'focus'} onChange={e => change('artScale', Number(e.target.value))} /><small>按实际可用留白显示，人物不覆盖输入、正文或审批。</small></label>
        {(!ready || !initialized) && <p className="asuka-settings__notice" data-state="warning" role="status">{saved.status === 'loading' || (ready && !initialized) ? slow ? '设置仍在读取，请检查宿主连接；尚未应用人物。' : '正在读取宿主设置…' : '当前连接未提供此皮肤的可用设置，请确认Host与Client均已加载。'}</p>}
        {ready && initialized && !writable && <p className="asuka-settings__notice" data-state="warning">当前连接不支持持久化写入，请从本机桌面或本机Harness连接修改。</p>}
        {conflict && <p className="asuka-settings__notice" data-state="warning">设置已在其他窗口改变，当前草稿仍保留。请重新载入再修改。</p>}
        <p className="asuka-settings__status" data-state={error ? 'error' : undefined} role={error ? 'alert' : 'status'}>{message || (dirty ? '有未保存的修改' : ready ? '与已保存设置一致' : '')}</p>
        <div className="asuka-settings__actions">
          <button type="button" disabled={!ready || saving} onClick={reloadDraft}>重新载入</button>
          <button type="button" disabled={!writable || saving} onClick={() => { setDraft(decodePreferences(saved.base) ?? { ...DEFAULT_PREFERENCES }); setReset(true); setMessage('已恢复默认草稿，保存后生效。'); setError(false) }}>恢复默认</button>
          <button type="button" onClick={close}>关闭</button>
          <button type="button" className="primary" disabled={!writable || !dirty || saving || conflict} onClick={() => void save()}>{saving ? '保存中…' : '保存'}</button>
        </div>
        <p className="asuka-settings__notice">保存在当前Harness的Host设置中；不更改模型、工具权限和审批规则。</p>
      </div>
    </section>
  }
}
