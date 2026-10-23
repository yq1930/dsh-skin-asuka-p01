import { useState } from 'react'
import type { ConfigForm, SettingsSectionOwnerProps } from '@deepseek-ai/dsh-client-ui-settings/client'
import { ART_SCALE_RANGE, INTENSITY_RANGE, type AsukaPreferences, type Presentation, type Side } from '../../preferences.ts'
import { bindForm } from '../form.ts'
import { useSettingsDraft } from './draft.ts'
import { SettingsPreview, type PreviewPhase } from './preview.tsx'

export function createSettingsPage(form: ConfigForm<AsukaPreferences>) {
  const useSaved = bindForm(form)
  return function AsukaSettings({ close }: SettingsSectionOwnerProps) {
    const saved = useSaved()
    const {
      draft, dirty, ready, initialized, writable, conflict, saving, slow, feedback,
      change, reload, restoreDefaults, save,
    } = useSettingsDraft(form, saved)
    const [previewPhase, setPreviewPhase] = useState<PreviewPhase>('active')
    const editable = writable && !saving
    const character = draft.presentation === 'character'
    const loadingNotice = saved.status === 'loading' || (ready && !initialized)
      ? slow ? '设置仍在读取，请检查宿主连接；尚未应用人物。' : '正在读取宿主设置…'
      : '当前连接未提供此皮肤的可用设置，请确认Host与Client均已加载。'

    return <section className="asuka-settings" aria-label="明日香 P01 主题设置">
      <header className="asuka-settings__header">
        <h2>明日香 · 绯色天际</h2>
        <p>明暗外观与字号在「通用设置」中调整，主题选项在此保存。</p>
      </header>
      <div>
        <div className="asuka-settings__preview-tabs" role="group" aria-label="预览场景">
          <button type="button" aria-pressed={previewPhase === 'hero'} onClick={() => setPreviewPhase('hero')}>欢迎页</button>
          <button type="button" aria-pressed={previewPhase === 'active'} onClick={() => setPreviewPhase('active')}>会话阅读</button>
        </div>
        <SettingsPreview draft={draft} phase={previewPhase} />
        <p className="asuka-settings__notice">两套精绘形象共享同一画风；会话中按两侧空间缩放。此处为草稿示意，保存后应用。</p>
      </div>
      <div className="asuka-settings__controls">
        <label className="asuka-settings__field">
          表现方式
          <select value={draft.presentation} disabled={!editable} onChange={e => change('presentation', e.target.value as Presentation)}>
            <option value="character">角色模式</option>
            <option value="focus">专注模式</option>
          </select>
        </label>
        <label className="asuka-settings__field">
          <input type="checkbox" checked={draft.background} disabled={!editable || !character} onChange={e => change('background', e.target.checked)} />
          显示穹顶背景
        </label>
        <label className="asuka-settings__field">
          主立绘位置
          <select value={draft.side} disabled={!editable || !character} onChange={e => change('side', e.target.value as Side)}>
            <option value="left">白衣在左，绯红在右</option>
            <option value="right">白衣在右，绯红在左</option>
          </select>
        </label>
        <label className="asuka-settings__field">
          背景强度 <output>{draft.intensity}%</output>
          <input type="range" min={INTENSITY_RANGE.min} max={INTENSITY_RANGE.max} step="1" value={draft.intensity}
            disabled={!editable || !draft.background || !character} onChange={e => change('intensity', Number(e.target.value))} />
          <small>欢迎页使用此强度；会话中两侧为其40%，中间进一步淡化，正文保持实色底。</small>
        </label>
        <label className="asuka-settings__field">
          人物大小 <output>{draft.artScale}%</output>
          <input type="range" min={ART_SCALE_RANGE.min} max={ART_SCALE_RANGE.max} step="1" value={draft.artScale}
            disabled={!editable || !character} onChange={e => change('artScale', Number(e.target.value))} />
          <small>按实际可用留白显示，人物不覆盖输入、正文或审批。</small>
        </label>
        {(!ready || !initialized) && <p className="asuka-settings__notice" data-state="warning" role="status">{loadingNotice}</p>}
        {ready && initialized && !writable && <p className="asuka-settings__notice" data-state="warning">当前连接不支持持久化写入，请从本机桌面或本机Harness连接修改。</p>}
        {conflict && <p className="asuka-settings__notice" data-state="warning">设置已在其他窗口改变，当前草稿仍保留。请重新载入再修改。</p>}
      </div>
      <p className="asuka-settings__status" data-state={feedback.error ? 'error' : undefined} role={feedback.error ? 'alert' : 'status'}>
        {feedback.text || (dirty ? '有未保存的修改' : ready ? '与已保存设置一致' : '')}
      </p>
      <div className="asuka-settings__actions">
        <button type="button" disabled={!ready || saving} onClick={reload}>重新载入</button>
        <button type="button" disabled={!writable || saving} onClick={restoreDefaults}>恢复默认</button>
        <button type="button" onClick={close}>关闭</button>
        <button type="button" className="primary" disabled={!writable || !dirty || saving || conflict} onClick={() => void save()}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
      <p className="asuka-settings__notice">保存后应用到当前配置，使用同一配置的其他窗口也会同步。</p>
    </section>
  }
}
