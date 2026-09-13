import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronRight, Info, Plus, Save, Settings2, ShieldCheck, Trash2, Undo2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { selectCan } from '../../services/selectors';
import { sortTemplates } from '../../services/modules';
import { useToast } from '../../components/Toast';
import { ModuleIcon } from '../../components/ui';
import type { FieldType, ModuleTemplate, TemplateField } from '../../types';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Строка' },
  { value: 'textarea', label: 'Абзац' },
  { value: 'list', label: 'Список (по строкам)' },
  { value: 'number', label: 'Число / метрика' },
];

export function TemplatesScreen() {
  const { moduleId } = useParams();
  const { state, dispatch } = useApp();
  const templates = useMemo(() => sortTemplates(state.templates), [state.templates]);
  const selected = templates.find((t) => t.id === moduleId);
  const canEdit = selectCan(state, 'template:edit');
  const canPerms = selectCan(state, 'permissions:edit');

  if (!moduleId && templates.length > 0) return <Navigate to={`/curator/templates/${templates[0].id}`} replace />;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Куратор · администрирование программы</div>
          <h1>Контент модулей</h1>
          <p>Задания, подсказки и поля шаблонов. Изменения мгновенно применяются для всех команд — one-pager каждой пересобирается по новой структуре.</p>
        </div>
      </div>

      <div className="grid grid--sidebar" style={{ gridTemplateColumns: '300px minmax(0,1fr)' }}>
        <aside className="stack">
          <div className="card" style={{ padding: 8 }}>
            {templates.map((t) => (
              <Link
                key={t.id}
                to={`/curator/templates/${t.id}`}
                className="module-card"
                style={{
                  gridTemplateColumns: '32px 1fr auto',
                  padding: '10px 12px',
                  marginBottom: 4,
                  borderColor: t.id === moduleId ? 'rgba(var(--accent-rgb),0.7)' : undefined,
                  background: t.id === moduleId ? 'rgba(var(--accent-rgb),0.12)' : undefined,
                }}
              >
                <span className="module-card__num" style={{ width: 32, height: 32, borderRadius: 9, fontSize: 13 }}>
                  {t.order}
                </span>
                <span>
                  <div className="module-card__title" style={{ fontSize: 14 }}>
                    <ModuleIcon name={t.icon} size={14} /> {t.title}
                  </div>
                  <div className="module-card__meta">{t.fields.length} полей</div>
                </span>
                <ChevronRight size={16} className="faint" />
              </Link>
            ))}
          </div>

          <div className="card">
            <div className="card__title">
              <ShieldCheck size={18} /> Полномочия куратора
            </div>
            <p className="muted small mb-2">Тумблеры меняют результат canAccess() для роли «куратор» в реальном времени.</p>
            <label className="toggle mb-2" style={{ display: 'flex' }}>
              <input
                type="checkbox"
                checked={state.curatorPermissions.canEditTemplates}
                disabled={!canPerms}
                onChange={(e) => dispatch({ type: 'SET_PERMISSIONS', patch: { canEditTemplates: e.target.checked } })}
              />
              <span className="toggle__track" />
              <span className="small">Может редактировать контент модулей</span>
            </label>
            <label className="toggle" style={{ display: 'flex' }}>
              <input
                type="checkbox"
                checked={state.curatorPermissions.canComment}
                disabled={!canPerms}
                onChange={(e) => dispatch({ type: 'SET_PERMISSIONS', patch: { canComment: e.target.checked } })}
              />
              <span className="toggle__track" />
              <span className="small">Может комментировать ответы команд</span>
            </label>
          </div>
        </aside>

        {selected ? (
          <TemplateEditor key={selected.id} template={selected} readOnly={!canEdit} />
        ) : (
          <div className="card muted">Выберите модуль слева.</div>
        )}
      </div>
    </main>
  );
}

function TemplateEditor({ template, readOnly }: { template: ModuleTemplate; readOnly: boolean }) {
  const { dispatch } = useApp();
  const toast = useToast();
  const [draft, setDraft] = useState<ModuleTemplate>(() => structuredClone(template));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(template);

  const patch = (p: Partial<ModuleTemplate>) => setDraft((d) => ({ ...d, ...p }));
  const patchField = (i: number, p: Partial<TemplateField>) =>
    setDraft((d) => ({ ...d, fields: d.fields.map((f, idx) => (idx === i ? { ...f, ...p } : f)) }));
  const move = (i: number, delta: number) =>
    setDraft((d) => {
      const j = i + delta;
      if (j < 0 || j >= d.fields.length) return d;
      const fields = [...d.fields];
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...d, fields };
    });
  const remove = (i: number) => setDraft((d) => ({ ...d, fields: d.fields.filter((_, idx) => idx !== i) }));
  const add = () =>
    setDraft((d) => {
      const used = new Set(d.fields.map((f) => f.key));
      let n = d.fields.length + 1;
      while (used.has(`field_${n}`)) n += 1;
      return {
        ...d,
        fields: [...d.fields, { key: `field_${n}`, label: '', type: 'textarea', placeholder: '', hint: '', required: false }],
      };
    });

  const validationError = (() => {
    if (!draft.title.trim()) return 'Название модуля обязательно';
    if (draft.fields.length === 0) return 'Добавьте хотя бы одно поле';
    if (draft.fields.some((f) => !f.label.trim())) return 'У каждого поля должно быть название';
    return null;
  })();

  const save = () => {
    if (saving) return;
    if (validationError) {
      toast.error('Проверьте шаблон', validationError);
      return;
    }
    setSaving(true);
    try {
      dispatch({ type: 'UPDATE_TEMPLATE', template: draft });
      toast.success('Контент модуля сохранён', 'Изменения уже видны всем командам.');
    } finally {
      window.setTimeout(() => setSaving(false), 500);
    }
  };

  return (
    <section className="card">
      <div className="row row--between mb-2">
        <div className="card__title" style={{ marginBottom: 0 }}>
          <Settings2 size={18} /> Модуль {template.order}: {template.title}
        </div>
        {readOnly && <span className="badge badge--neutral">Только просмотр — редактирование отключено</span>}
      </div>

      <div className="field">
        <label className="field__label">Название модуля</label>
        <input className="input" value={draft.title} disabled={readOnly} onChange={(e) => patch({ title: e.target.value })} />
      </div>
      <div className="field">
        <label className="field__label">Описание задания</label>
        <textarea className="textarea" style={{ minHeight: 80 }} value={draft.description} disabled={readOnly} onChange={(e) => patch({ description: e.target.value })} />
        <div className="field__hint">
          <Info size={14} /> Короткая формулировка — показывается в списке модулей и в шапке экрана модуля.
        </div>
      </div>
      <div className="field">
        <label className="field__label">Развёрнутая подсказка / пример хорошего ответа</label>
        <textarea className="textarea" value={draft.guidance} disabled={readOnly} onChange={(e) => patch({ guidance: e.target.value })} />
        <div className="field__hint">
          <Info size={14} /> Блок «Как ответить хорошо» над формой. Здесь уместен пример сильного ответа.
        </div>
      </div>

      <div className="divider" />
      <div className="row row--between mb-2">
        <h3 style={{ fontSize: 16 }}>Поля шаблона ответа ({draft.fields.length})</h3>
        {!readOnly && (
          <button className="btn btn--sm" onClick={add}>
            <Plus size={14} /> Добавить поле
          </button>
        )}
      </div>

      <div className="stack">
        {draft.fields.map((f, i) => (
          <div key={f.key} className="field-editor">
            <div className="field-editor__head">
              <span className="small muted">
                Поле {i + 1} · ключ <span className="mono">{f.key}</span>
              </span>
              {!readOnly && (
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn btn--ghost btn--icon" title="Выше" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={14} />
                  </button>
                  <button className="btn btn--ghost btn--icon" title="Ниже" disabled={i === draft.fields.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={14} />
                  </button>
                  <button className="btn btn--ghost btn--icon" title="Удалить поле" onClick={() => remove(i)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="field-editor__grid">
              <input className="input" placeholder="Название поля" value={f.label} disabled={readOnly} onChange={(e) => patchField(i, { label: e.target.value })} />
              <select className="select" value={f.type} disabled={readOnly} onChange={(e) => patchField(i, { type: e.target.value as FieldType })}>
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="checkbox">
                <input type="checkbox" checked={f.required} disabled={readOnly} onChange={(e) => patchField(i, { required: e.target.checked })} />
                Обязательное
              </label>
            </div>
            <textarea
              className={`textarea ${f.type === 'list' ? 'textarea--list' : ''}`}
              style={{ minHeight: 56 }}
              rows={f.type === 'list' ? 3 : 2}
              placeholder={f.type === 'list' ? 'Плейсхолдер — пример списка, каждый пункт с новой строки' : 'Плейсхолдер (пример значения)'}
              value={f.placeholder}
              disabled={readOnly}
              onChange={(e) => patchField(i, { placeholder: e.target.value })}
            />
            <input className="input" placeholder="Подсказка — что именно писать" value={f.hint} disabled={readOnly} onChange={(e) => patchField(i, { hint: e.target.value })} />
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="save-bar">
          <div className={`save-bar__status ${dirty ? 'save-bar__status--dirty' : ''}`}>
            {validationError ? <span style={{ color: 'var(--danger)' }}>{validationError}</span> : dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
          </div>
          <div className="row">
            <button className="btn" disabled={!dirty} onClick={() => setDraft(structuredClone(template))}>
              <Undo2 size={16} /> Отменить
            </button>
            <button className="btn btn--primary" disabled={saving || !dirty || Boolean(validationError)} onClick={save}>
              <Save size={16} /> Сохранить для всех команд
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
