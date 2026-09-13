import { useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flag,
  MessageSquare,
  Pencil,
  Presentation,
  Rocket,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { selectActivity, selectAnswers, selectComments, selectMyProject } from '../../services/selectors';
import {
  computeOverallProgress,
  findAnswer,
  getCurrentModule,
  getModuleStatus,
  getModuleVisualState,
  sortTemplates,
} from '../../services/modules';
import { Initials, ModuleIcon, ProgressRing, StatusBadge, formatDate, relativeTime, visualStateLabel } from '../../components/ui';

export function PeerHomeScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const project = selectMyProject(state);
  const templates = useMemo(() => sortTemplates(state.templates), [state.templates]);

  if (!project) return <Navigate to="/peer/new" replace />;

  const answers = selectAnswers(state, project.id);
  const comments = selectComments(state, project.id);
  const activity = selectActivity(state, project.id).slice(0, 5);
  const progress = computeOverallProgress(project.id, templates, answers);
  const current = getCurrentModule(project.id, templates, answers);
  const allDone = progress.completed === progress.total;

  const achievements = [
    { id: 'first', label: 'Первый шаг', icon: <Flag size={14} />, unlocked: progress.completed >= 1, hint: 'Завершить 1 модуль' },
    { id: 'half', label: 'Половина пути', icon: <Sparkles size={14} />, unlocked: progress.completed >= Math.ceil(progress.total / 2), hint: `Завершить ${Math.ceil(progress.total / 2)} модулей` },
    { id: 'full', label: 'One-pager готов', icon: <Trophy size={14} />, unlocked: allDone && progress.total > 0, hint: 'Завершить все модули' },
    { id: 'feedback', label: 'Есть фидбек куратора', icon: <MessageSquare size={14} />, unlocked: comments.length > 0, hint: 'Получить комментарий' },
  ];

  return (
    <main className="page">
      <section className="project-hero">
        <div>
          <span className="badge badge--accent">{project.category}</span>
          <h1 className="mt-1">{project.name}</h1>
          {project.hook && <p className="project-hero__hook">{project.hook}</p>}
          {project.description && <p className="project-hero__desc">{project.description}</p>}
          <div className="team-chips">
            {project.team.length === 0 && <span className="muted small">Состав команды не указан</span>}
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
            <Link to="/peer/profile" className="btn btn--sm">
              <Pencil size={14} /> Редактировать профиль
            </Link>
            <span className="faint small">Создан {formatDate(project.createdAt)} · обновлён {relativeTime(project.updatedAt)}</span>
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
            <div className="progress-summary__headline">
              Заполнено {progress.completed} из {progress.total}
            </div>
            <div className="progress-summary__remaining">
              {allDone ? (
                <>
                  <strong>Все модули пройдены.</strong> One-pager собран полностью.
                </>
              ) : (
                <>
                  Осталось: <strong>{progress.remaining.map((t) => t.title).join(', ')}</strong>
                  {progress.inProgress > 0 && <> · из них в черновиках: {progress.inProgress}</>}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid--sidebar mt-3">
        <section>
          <div className="row row--between mb-2">
            <h2 style={{ fontSize: 20 }}>Модули программы</h2>
            {current ? (
              <button className="btn btn--primary" onClick={() => navigate(`/peer/module/${current.id}`)}>
                <Sparkles size={16} /> Продолжить: {current.order}. {current.title}
              </button>
            ) : (
              <Link to="/peer/onepager" className="btn btn--primary">
                <FileText size={16} /> Открыть one-pager
              </Link>
            )}
          </div>

          <div className="module-list">
            {templates.map((t) => {
              const answer = findAnswer(answers, project.id, t.id);
              const status = getModuleStatus(t, answer);
              const visual = getModuleVisualState(t, status, current?.id ?? null);
              const moduleComments = comments.filter((c) => c.moduleTemplateId === t.id).length;
              return (
                <Link
                  key={t.id}
                  to={`/peer/module/${t.id}`}
                  className={`module-card module-card--${visual}`}
                  aria-label={`Модуль ${t.order}: ${t.title} — ${visualStateLabel(visual)}`}
                  data-state={visual}
                >
                  <span className="module-card__num">{visual === 'completed' ? <CheckCircle2 size={20} /> : t.order}</span>
                  <span>
                    <div className="module-card__title">
                      <ModuleIcon name={t.icon} size={16} />
                      {t.title}
                      <StatusBadge status={status} current={visual === 'current'} />
                    </div>
                    <div className="module-card__desc">{t.description}</div>
                    <div className="module-card__meta mt-1">
                      <span>{t.fields.length} полей · {t.fields.filter((f) => f.required).length} обязательных</span>
                      {answer && <span>· сохранён {relativeTime(answer.updatedAt)}</span>}
                      {moduleComments > 0 && (
                        <span className="row" style={{ gap: 4, color: '#f59e0b' }}>
                          · <MessageSquare size={12} /> {moduleComments}
                        </span>
                      )}
                    </div>
                  </span>
                  <span className="module-card__side">
                    <ChevronRight size={18} className="faint" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="stack">
          <div className="card">
            <div className="card__title">
              <FileText size={18} /> One-pager проекта
            </div>
            <p className="muted small">
              Собирается автоматически из ответов модулей. Готово {progress.completed} из {progress.total} разделов.
            </p>
            <div className="stack mt-2">
              <Link to="/peer/onepager" className="btn btn--primary btn--block">
                Открыть one-pager <ArrowRight size={16} />
              </Link>
              <Link to={`/present/${project.id}`} className="btn btn--block">
                <Presentation size={16} /> Режим презентации
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card__title">
              <Award size={18} /> Достижения
            </div>
            <div className="achievements">
              {achievements.map((a) => (
                <span key={a.id} className={`achievement ${a.unlocked ? 'achievement--unlocked' : ''}`} title={a.hint}>
                  {a.icon} {a.label}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__title">
              <Rocket size={18} /> Последняя активность
            </div>
            {activity.length === 0 ? (
              <p className="muted small">Пока пусто — сохраните первый ответ.</p>
            ) : (
              <div className="activity">
                {activity.map((e) => (
                  <div key={e.id} className="activity__item">
                    <span className="activity__icon">
                      <ActivityIcon type={e.type} />
                    </span>
                    <div>
                      <div className="activity__text">{e.text}</div>
                      <div className="activity__meta">
                        {e.actorName} · {relativeTime(e.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/peer/activity" className="btn btn--ghost btn--sm mt-1">
              Вся активность <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

export function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'module_completed':
      return <CheckCircle2 size={16} />;
    case 'comment_added':
      return <MessageSquare size={16} />;
    case 'project_created':
      return <Rocket size={16} />;
    case 'template_updated':
      return <Pencil size={16} />;
    default:
      return <FileText size={16} />;
  }
}
