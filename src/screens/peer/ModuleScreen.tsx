import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  FileText,
  Info,
  Lightbulb,
  MessageSquare,
  Save,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { selectAnswers, selectCan, selectComments, selectMyProject } from '../../services/selectors';
import {
  findAnswer,
  getCurrentModule,
  getModuleStatus,
  getModuleVisualState,
  sortTemplates,
  validateModuleAnswer,
} from '../../services/modules';
import { assembleOnePager } from '../../services/onePager';
import { useToast } from '../../components/Toast';
import { ConfettiBurst, ModuleIcon, StatusBadge, formatDate, moduleColor, moduleStyle, relativeTime } from '../../components/ui';
import type { CSSProperties } from 'react';
import { NotFound } from '../../components/guards';
import type { ModuleAnswer, ModuleTemplate, Project } from '../../types';

export function ModuleScreen() {
  const { moduleId } = useParams();
  const { state } = useApp();
  const project = selectMyProject(state);
  const templates = useMemo(() => sortTemplates(state.templates), [state.templates]);
  const template = templates.find((t) => t.id === moduleId);

  if (!project) return <Navigate to="/peer/new" replace />;
  if (!template) return <NotFound what="Модуль" />;

  const answers = selectAnswers(state, project.id);
  const answer = findAnswer(answers, project.id, template.id);

  // key = только id модуля: форма живёт между сохранениями, поэтому флаг saving не сбрасывается ремонтом
  return (
    <ModuleForm
      key={template.id}
      project={project}
      template={template}
      templates={templates}
      answers={answers}
      answer={answer}
    />
  );
}

interface FormProps {
  project: Project;
  template: ModuleTemplate;
  templates: ModuleTemplate[];
  answers: ModuleAnswer[];
  answer: ModuleAnswer | undefined;
}

function ModuleForm({ project, template, templates, answers, answer }: FormProps) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const initialValues = useMemo(() => {
    const v: Record<string, string> = {};
    for (const f of template.fields) v[f.key] = answer?.values[f.key] ?? '';
    return v;
  }, [template, answer]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [burst, setBurst] = useState(0); // ключ залпа конфетти
  const [flash, setFlash] = useState(false);

  // Сравниваем нормализованные значения: сервис сохраняет trim(), локально пробелы остаются
  const normalize = (v: Record<string, string>) => JSON.stringify(template.fields.map((f) => (v[f.key] ?? '').trim()));
  const dirty = normalize(values) !== normalize(initialValues);
  const validation = validateModuleAnswer(template, values);
  const savedStatus = getModuleStatus(template, answer);
  const current = getCurrentModule(project.id, templates, answers);
  const idx = templates.findIndex((t) => t.id === template.id);
  const prev = idx > 0 ? templates[idx - 1] : null;
  const next = idx < templates.length - 1 ? templates[idx + 1] : null;
  const comments = selectComments(state, project.id, template.id);
  const canEdit = selectCan(state, 'answer:edit', project.id);

  // Секция one-pager из СОХРАНЁННОГО состояния — доказательство, что документ собирается из стора, а не из формы
  const savedSection = useMemo(
    () => assembleOnePager(project, templates, answers).sections.find((s) => s.moduleId === template.id),
    [project, templates, answers, template.id],
  );

  const save = (thenGoNext = false) => {
    if (saving) return; // защита от двойного клика: кнопка заблокирована, пока сохранение не завершено
    setAttempted(true);
    if (!canEdit) {
      toast.error('Нет прав на редактирование этого проекта');
      return;
    }
    if (validation.isEmpty) {
      toast.error('Нечего сохранять', 'Заполните хотя бы одно поле — черновик тоже сохраняется.');
      return;
    }
    setSaving(true);
    try {
      dispatch({ type: 'SAVE_ANSWER', projectId: project.id, moduleTemplateId: template.id, values });
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1200);
      if (validation.status === 'completed') {
        toast.success('Сохранено ✓', `Модуль «${template.title}» завершён — раздел обновлён в one-pager.`);
        if (savedStatus !== 'completed') setBurst((b) => b + 1); // конфетти только при первом завершении
      } else {
        toast.success(
          'Сохранено как черновик ✓',
          `Чтобы завершить модуль, заполните: ${validation.missingRequired.map((f) => f.label).join(', ')}.`,
        );
      }
      if (thenGoNext && next) navigate(`/peer/module/${next.id}`);
    } finally {
      window.setTimeout(() => setSaving(false), 350);
    }
  };

  return (
    <main className="page" style={moduleStyle(template.order)}>
      {burst > 0 && <ConfettiBurst key={burst} seed={burst} originX={50} originY={88} />}
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: moduleColor(template.order) }}>
            Модуль {template.order} из {templates.length} · {project.name}
          </div>
          <h1 className="row" style={{ gap: 12 }}>
            <span
              className="module-card__num"
              style={{ width: 40, height: 40, borderRadius: 12, fontSize: 18 } as CSSProperties}
              aria-hidden
            >
              <ModuleIcon name={template.icon} size={20} />
            </span>
            {template.title}
            <StatusBadge status={savedStatus} current={current?.id === template.id} />
          </h1>
          <p>{template.description}</p>
        </div>
        <div className="page-head__actions">
          <div className="module-progress-dots" title="Прогресс по модулям">
            {templates.map((t) => {
              const st = getModuleStatus(t, findAnswer(answers, project.id, t.id));
              const vis = getModuleVisualState(t, st, current?.id ?? null);
              return (
                <Link
                  key={t.id}
                  to={`/peer/module/${t.id}`}
                  className={`dot dot--${vis} ${t.id === template.id ? 'dot--active' : ''}`}
                  style={moduleStyle(t.order)}
                  title={`${t.order}. ${t.title}`}
                />
              );
            })}
          </div>
          <Link to="/peer" className="btn btn--sm">
            <ArrowLeft size={14} /> К модулям
          </Link>
        </div>
      </div>

      <div className="grid grid--sidebar">
        <section>
          <div className="guidance mb-2 rise">
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Lightbulb size={16} style={{ color: moduleColor(template.order) }} />
              <strong style={{ color: moduleColor(template.order) }}>Как ответить хорошо</strong>
            </div>
            {template.guidance}
          </div>

          <div className="card rise rise--1">
            {template.fields.map((f) => {
              const value = values[f.key] ?? '';
              const missing = attempted && f.required && !value.trim();
              const inputId = `f-${template.id}-${f.key}`;
              return (
                <div key={f.key} className="field">
                  <label className="field__label" htmlFor={inputId}>
                    {f.label}
                    {f.required ? <span className="req">обязательно</span> : <span className="opt">необязательно</span>}
                  </label>
                  {f.type === 'text' || f.type === 'number' ? (
                    <input
                      id={inputId}
                      className={`input ${missing ? 'input--invalid' : ''}`}
                      type={f.type === 'number' ? 'text' : 'text'}
                      inputMode={f.type === 'number' ? 'numeric' : undefined}
                      placeholder={f.placeholder}
                      value={value}
                      disabled={!canEdit}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <textarea
                      id={inputId}
                      className={`textarea ${f.type === 'list' ? 'textarea--list' : ''} ${missing ? 'textarea--invalid' : ''}`}
                      placeholder={f.placeholder}
                      value={value}
                      disabled={!canEdit}
                      rows={f.type === 'list' ? 4 : 4}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                  <div className="field__hint">
                    <Info size={14} />
                    <span>
                      {f.hint}
                      {f.type === 'list' && <> Каждый пункт — с новой строки, в one-pager станет списком.</>}
                    </span>
                  </div>
                  {missing && <div className="field__error">Это поле обязательно для завершения модуля</div>}
                </div>
              );
            })}
          </div>

          <div className={`save-bar ${flash ? 'save-bar--flash' : ''}`}>
            <div
              className={`save-bar__status ${dirty ? 'save-bar__status--dirty' : answer ? 'save-bar__status--saved' : ''}`}
              aria-live="polite"
            >
              {dirty ? (
                <>
                  <CircleDashed size={15} /> Есть несохранённые изменения
                </>
              ) : answer ? (
                <>
                  <CheckCircle2 size={15} /> Сохранено {formatDate(answer.updatedAt, true)}
                </>
              ) : (
                <>
                  <Info size={15} /> Ответ ещё не сохранялся
                </>
              )}
              {!validation.isEmpty && validation.status !== 'completed' && (
                <span className="faint">· не хватает: {validation.missingRequired.map((f) => f.label).join(', ')}</span>
              )}
            </div>
            <div className="row">
              <button className="btn btn--primary" disabled={saving || !canEdit} onClick={() => save(false)}>
                <Save size={16} /> {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
              {next && (
                <button className="btn" disabled={saving || !canEdit} onClick={() => save(true)} title="Сохранить и перейти к следующему модулю">
                  Сохранить и дальше <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="module-nav">
            {prev ? (
              <Link to={`/peer/module/${prev.id}`} className="btn btn--ghost">
                <ArrowLeft size={16} /> {prev.order}. {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/peer/module/${next.id}`} className="btn btn--ghost">
                {next.order}. {next.title} <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/peer/onepager" className="btn btn--ghost">
                К one-pager <FileText size={16} />
              </Link>
            )}
          </div>
        </section>

        <aside className="stack">
          <div className="card card--hover rise rise--2">
            <div className="card__title">
              <FileText size={18} /> Как это выглядит в one-pager
            </div>
            {!savedSection || savedSection.blocks.length === 0 ? (
              <p className="muted small">
                Раздел «{template.title}» пока пуст. Сохраните ответ — и он появится здесь и в документе автоматически.
              </p>
            ) : (
              <div className="answer-view">
                {savedSection.blocks.map((b) => (
                  <div key={b.label} className="answer-view__field">
                    <div className="answer-view__label">{b.label}</div>
                    <div className="answer-view__value">
                      {b.kind === 'list' ? (
                        <ul>
                          {b.items.map((it, i) => (
                            <li key={i}>{it}</li>
                          ))}
                        </ul>
                      ) : (
                        b.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {dirty && <p className="small mt-2" style={{ color: 'var(--warning)' }}>Превью отражает сохранённую версию. Нажмите «Сохранить», чтобы обновить документ.</p>}
            <Link to="/peer/onepager" className="btn btn--sm mt-2">
              Открыть весь one-pager <ArrowRight size={14} />
            </Link>
          </div>

          <div className="card card--hover rise rise--3">
            <div className="card__title">
              <MessageSquare size={18} style={{ color: '#f59e0b' }} /> Комментарии куратора
            </div>
            {comments.length === 0 ? (
              <p className="muted small">Куратор ещё не комментировал этот модуль.</p>
            ) : (
              <div className="stack">
                {comments.map((c) => (
                  <div key={c.id} className="comment">
                    <div className="comment__head">
                      <strong>{c.author}</strong>
                      <span>{relativeTime(c.createdAt)}</span>
                    </div>
                    <div className="comment__text">{c.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card--tight">
            <div className="row small muted">
              <BookOpen size={14} /> {template.fields.filter((f) => f.required).length} обязательных полей из {template.fields.length}. Черновик можно
              сохранить в любой момент.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
