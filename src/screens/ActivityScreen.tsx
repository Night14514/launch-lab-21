import { Activity } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { selectActivity, selectMyProject } from '../services/selectors';
import { ActivityIcon } from './peer/PeerHomeScreen';
import { EmptyState, formatDate, relativeTime, staggerStyle } from '../components/ui';

/** Лента активности: пир видит только свой проект, куратор — все проекты и системные события. */
export function ActivityScreen({ scope }: { scope: 'peer' | 'curator' }) {
  const { state } = useApp();
  const myProject = selectMyProject(state);
  const events = scope === 'peer' ? (myProject ? selectActivity(state, myProject.id) : []) : selectActivity(state);
  const projectName = (id: string | null) => (id ? state.projects.find((p) => p.id === id)?.name ?? '—' : 'Программа');

  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">{scope === 'peer' ? 'Мой проект' : 'Все команды'}</div>
          <h1>Лента активности</h1>
          <p>
            {scope === 'peer'
              ? 'История изменений вашего one-pager: сохранения, завершённые модули, комментарии куратора.'
              : 'Что происходит во всех командах инкубатора и в контенте программы.'}
          </p>
        </div>
      </div>
      <div className="card">
        {events.length === 0 ? (
          <EmptyState icon={<Activity size={36} />} title="Пока тихо">
            Событий ещё нет.
          </EmptyState>
        ) : (
          <div className="activity">
            {events.map((e, i) => (
              <div key={e.id} className="activity__item" style={staggerStyle(Math.min(i, 12))}>
                <span className={`activity__icon activity__icon--${e.type}`}>
                  <ActivityIcon type={e.type} />
                </span>
                <div>
                  <div className="activity__text">
                    {scope === 'curator' && <span className="badge badge--neutral" style={{ marginRight: 8 }}>{projectName(e.projectId)}</span>}
                    {e.text}
                  </div>
                  <div className="activity__meta">
                    {e.actorName} · {relativeTime(e.createdAt)} · {formatDate(e.createdAt, true)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
