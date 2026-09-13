import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Eye, FileText, Lock, MessageSquare, Presentation, Send } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { selectAnswers, selectCan, selectComments, selectProject } from '../../services/selectors';
import { computeOverallProgress, findAnswer, getCurrentModule, getModuleStatus, getModuleVisualState, sortTemplates, splitList } from '../../services/modules';
import { useToast } from '../../components/Toast';
import { Initials, ModuleIcon, ProgressRing, StatusBadge, formatDate, relativeTime } from '../../components/ui';
import { NotFound } from '../../components/guards';
import type { ModuleTemplate, Project } from '../../types';

export function CuratorProjectScreen() {
  const { projectId } = useParams();
  const { state } = useApp();
  const project = selectProject(state, projectId);
  const templates = useMemo(() => sortTemplates(state.templates), [state.templates]);

  // Куратор имеет право читать любой проект, значит null здесь = проект не существует (битая ссылка)
  if (!project) return <NotFound what="Команда" />;

  const answers = selectAnswers(state, project.id);
  const progress = computeOverallProgress(project.id, templates, answers);
  const current = getCurrentModule(project.id, templates, answers);
  const allDone = progress.completed === progress.total;

  return (
    <main className="page">
      <div className="row mb-2">
        <Link to="/curator" className="btn btn--ghost btn--sm">
          <ArrowLeft size={14} /> Все команды
        </Link>
        <span className="badge badge--neutral">
          <Eye size={12} /> Режим просмотра — ответы команды нельзя редактировать
        </span>
      </div>

      <section className="project-hero">
        <div>
          <span className="badge badge--accent">{project.category}</span>
          <h1 className="mt-1">{project.name}</h1>
          {project.hook && <p className="project-hero__hook">{project.hook}</p>}
          {project.description && <p className="project-hero__desc">{project.description}</p>}
          <div className="team-chips">
            {project.team.map((m, i) => (
              <span key={i} className="team-chip">
                <span className="team-chip__avatar">
                  <Initials name={m.name} />
                </span>
                {m.name} {m.role && <small>· {m.role}</small>}
              </span>
            ))}
          </div>
          <div className="row mt-2 row--wrap">
            <Link to={`/curator/project/${project.id}/onepager`} className="btn btn--sm">
              <FileText size={14} /> One-pager
            </Link>
            <Link to={`/present/${project.id}`} className="btn btn--sm">
              <Presentation size={14} /> Презентация
            </Link>
            <span className="faint small">
              Создан {formatDate(project.createdAt)} · обновлён {relativeTime(project.updatedAt)}
            </span>
          </div>
        </div>
        <div className="progress-summary">
          <ProgressRing
            value={progress.percent}
            size={110}
            stroke={10}
            success={allDone}
            label={
              <span>
                {progress.completed}/{progress.total}
                <small>модулей</small>
              </span>
            }
          />
          <div className="progress-summary__text">
            <div className="progress-summary__headline">Заполнено {progress.completed} из {progress.total}</div>
            <div className="progress-summary__remaining">
              {allDone ? (
                <strong>Программа пройдена полностью</strong>
              ) : (
                <>
                  Текущий модуль: <strong>{current ? `${current.order}. ${current.title}` : '—'}</strong>
                  <br />
                  Осталось: {progress.remaining.map((t) => t.title).join(', ')}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <h2 className="mt-3 mb-2" style={{ fontSize: 20 }}>
        Ответы по модулям
      </h2>
      <div className="accordion">
        {templates.map((t) => (
          <ModuleAccordionItem key={t.id} project={project} template={t} currentId={current?.id ?? null} defaultOpen={t.id === current?.id} />
        ))}
      </div>
    </main>
  );
}

function ModuleAccordionItem({
  project,
  template,
  currentId,
  defaultOpen,
}: {
  project: Project;
  template: ModuleTemplate;
  currentId: string | null;
  defaultOpen: boolean;
}) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const answers = selectAnswers(state, project.id);
  const answer = findAnswer(answers, project.id, template.id);
  const status = getModuleStatus(template, answer);
  const visual = getModuleVisualState(template, status, currentId);
  const comments = selectComments(state, project.id, template.id);
  const canComment = selectCan(state, 'comment:create', project.id);

  const send = () => {
    if (sending) return;
    if (!text.trim()) {
      toast.error('Введите текст комментария');
      return;
    }
    setSending(true);
    try {
      dispatch({ type: 'ADD_COMMENT', projectId: project.id, moduleTemplateId: template.id, text });
      setText('');
      toast.success('Комментарий отправлен', `Команда «${project.name}» увидит его в модуле «${template.title}».`);
    } finally {
      window.setTimeout(() => setSending(false), 500);
    }
  };

  return (
    <div className="accordion__item">
      <button className="accordion__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`module-card__num ${visual === 'completed' ? '' : ''}`} style={{ width: 36, height: 36, borderRadius: 10 }}>
          {visual === 'completed' ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : template.order}
        </span>
        <span>
          <div className="module-card__title">
            <ModuleIcon name={template.icon} size={15} /> {template.title}
            <StatusBadge status={status} current={visual === 'current'} />
          </div>
          <div className="module-card__desc">{answer ? `Сохранён ${relativeTime(answer.updatedAt)}` : 'Команда ещё не отвечала'}</div>
        </span>
        <span className="row small muted" style={{ gap: 4 }}>
          <MessageSquare size={14} /> {comments.length}
        </span>
        {open ? <ChevronUp size={18} className="faint" /> : <ChevronDown size={18} className="faint" />}
      </button>

      {open && (
        <div className="accordion__body">
          <div className="grid grid--sidebar mt-2">
            <div className="answer-view">
              {template.fields.map((f) => {
                const value = answer?.values[f.key]?.trim() ?? '';
                return (
                  <div key={f.key} className="answer-view__field">
                    <div className="answer-view__label">
                      {f.label} {f.required && <span style={{ color: 'var(--accent)' }}>*</span>}
                    </div>
                    {value ? (
                      f.type === 'list' ? (
                        <div className="answer-view__value">
                          <ul>
                            {splitList(value).map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="answer-view__value">{value}</div>
                      )
                    ) : (
                      <div className="answer-view__value answer-view__value--empty">
                        <Lock size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                        Не заполнено. Подсказка команде: {f.hint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="card card--tight">
              <div className="card__title" style={{ marginBottom: 10 }}>
                <MessageSquare size={16} /> Комментарии куратора
              </div>
              {comments.length === 0 ? (
                <p className="muted small">Комментариев к этому модулю пока нет.</p>
              ) : (
                <div className="stack">
                  {comments.map((c) => (
                    <div key={c.id} className="comment">
                      <div className="comment__head">
                        <strong>{c.author}</strong>
                        <span>{formatDate(c.createdAt, true)}</span>
                      </div>
                      <div className="comment__text">{c.text}</div>
                    </div>
                  ))}
                </div>
              )}
              {canComment ? (
                <div className="mt-2">
                  <textarea
                    className="textarea"
                    style={{ minHeight: 80 }}
                    placeholder={`Что команде стоит улучшить в модуле «${template.title}»?`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
                    }}
                  />
                  <div className="row row--between mt-1">
                    <span className="faint small">
                      <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> — отправить
                    </span>
                    <button className="btn btn--primary btn--sm" disabled={sending || !text.trim()} onClick={send}>
                      <Send size={14} /> Отправить
                    </button>
                  </div>
                </div>
              ) : (
                <p className="faint small mt-2">Право комментировать отключено в настройках полномочий.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
