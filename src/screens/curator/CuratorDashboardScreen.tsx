import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, FolderKanban, MessageSquare, Sparkles, Users } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { selectAnswers, selectComments, selectVisibleProjects } from '../../services/selectors';
import { computeOverallProgress, getCurrentModule } from '../../services/modules';
import { EmptyState, ProgressBar, ProgressRing, relativeTime } from '../../components/ui';

type SortKey = 'progress' | 'name' | 'updated';

export function CuratorDashboardScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('progress');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  // Куратор видит ВСЕ проекты — селектор пропускает их через canAccess('project:read')
  const projects = selectVisibleProjects(state);

  const rows = useMemo(
    () =>
      projects.map((p) => {
        const answers = selectAnswers(state, p.id);
        const progress = computeOverallProgress(p.id, state.templates, answers);
        const current = getCurrentModule(p.id, state.templates, answers);
        const comments = selectComments(state, p.id).length;
        return { project: p, progress, current, comments };
      }),
    [projects, state],
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'progress') cmp = a.progress.percent - b.progress.percent;
      if (sortKey === 'name') cmp = a.project.name.localeCompare(b.project.name, 'ru');
      if (sortKey === 'updated') cmp = a.project.updatedAt.localeCompare(b.project.updatedAt);
      return dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, dir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setDir(dir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (k: SortKey) =>
    sortKey !== k ? <ArrowUpDown size={12} /> : dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;

  const total = rows.length;
  const avg = total ? Math.round(rows.reduce((s, r) => s + r.progress.percent, 0) / total) : 0;
  const finished = rows.filter((r) => r.progress.completed === r.progress.total).length;
  const totalComments = rows.reduce((s, r) => s + r.comments, 0);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Куратор · Launch Lab 21</div>
          <h1>Все команды инкубатора</h1>
          <p>Единая картина прогресса всех проектов. Нажмите на команду, чтобы открыть её ответы и оставить комментарий.</p>
        </div>
      </div>

      <div className="grid grid--3 mb-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        <div className="card stat">
          <Users className="stat__icon" size={20} />
          <div className="stat__value">{total}</div>
          <div className="stat__label">команд в программе</div>
        </div>
        <div className="card stat">
          <Sparkles className="stat__icon" size={20} />
          <div className="stat__value">{avg}%</div>
          <div className="stat__label">средний прогресс</div>
        </div>
        <div className="card stat">
          <CheckCircle2 className="stat__icon" size={20} />
          <div className="stat__value">{finished}</div>
          <div className="stat__label">one-pager собран полностью</div>
        </div>
        <div className="card stat">
          <MessageSquare className="stat__icon" size={20} />
          <div className="stat__value">{totalComments}</div>
          <div className="stat__label">комментариев оставлено</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <EmptyState icon={<FolderKanban size={36} />} title="Проектов пока нет">
            Команды появятся здесь после создания проекта.
          </EmptyState>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}></th>
                <th>
                  <button className={sortKey === 'name' ? 'active' : ''} onClick={() => toggleSort('name')}>
                    Проект {sortIcon("name")}
                  </button>
                </th>
                <th style={{ minWidth: 220 }}>
                  <button className={sortKey === 'progress' ? 'active' : ''} onClick={() => toggleSort('progress')}>
                    Прогресс {sortIcon("progress")}
                  </button>
                </th>
                <th>Текущий модуль</th>
                <th>Команда</th>
                <th>
                  <button className={sortKey === 'updated' ? 'active' : ''} onClick={() => toggleSort('updated')}>
                    Обновлён {sortIcon("updated")}
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <MessageSquare size={14} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ project, progress, current, comments }) => {
                const done = progress.completed === progress.total;
                return (
                  <tr key={project.id} onClick={() => navigate(`/curator/project/${project.id}`)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/curator/project/${project.id}`)}>
                    <td>
                      <ProgressRing value={progress.percent} size={48} stroke={5} success={done} label={<span style={{ fontSize: 11 }}>{progress.percent}%</span>} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{project.name}</div>
                      <div className="muted small">{project.category}</div>
                    </td>
                    <td>
                      <div className="row row--between small" style={{ marginBottom: 6 }}>
                        <span>
                          Заполнено <b>{progress.completed}</b> из {progress.total}
                        </span>
                        {progress.inProgress > 0 && <span className="badge badge--in_progress">черновиков: {progress.inProgress}</span>}
                      </div>
                      <ProgressBar value={progress.percent} success={done} />
                    </td>
                    <td>
                      {current ? (
                        <span className="badge badge--current">
                          {current.order}. {current.title}
                        </span>
                      ) : (
                        <span className="badge badge--completed">
                          <CheckCircle2 size={12} /> Все модули пройдены
                        </span>
                      )}
                    </td>
                    <td className="small muted">
                      {project.team.length > 0 ? `${project.team.length} чел. · ${project.team[0].name}${project.team.length > 1 ? ' и др.' : ''}` : '—'}
                    </td>
                    <td className="small muted">{relativeTime(project.updatedAt)}</td>
                    <td style={{ textAlign: 'right' }} className="small">
                      {comments}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
