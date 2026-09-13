import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Rocket, ShieldCheck, UserRound } from 'lucide-react';
import { DEMO_ACTORS } from '../data/mockData';
import { useApp } from '../state/AppContext';
import { computeOverallProgress } from '../services/modules';
import { Initials } from '../components/ui';
import { onSpotlightMove } from '../components/AmbientBackground';
import type { Actor } from '../types';

export function RoleSelectScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  if (state.actor) {
    return <Navigate to={state.actor.role === 'curator' ? '/curator' : '/peer'} replace />;
  }

  const login = (actor: Actor) => {
    dispatch({ type: 'LOGIN', actor });
    navigate(actor.role === 'curator' ? '/curator' : '/peer');
  };

  const peers = DEMO_ACTORS.filter((a) => a.role === 'peer');
  const curators = DEMO_ACTORS.filter((a) => a.role === 'curator');

  const projectMeta = (actor: Actor) => {
    const pid = actor.projectId ?? state.peerProjects[actor.id];
    if (!pid) return 'Проекта ещё нет — откроется мастер создания';
    const project = state.projects.find((p) => p.id === pid);
    if (!project) return 'Проект не найден';
    const progress = computeOverallProgress(pid, state.templates, state.answers);
    return `${project.name} · заполнено ${progress.completed} из ${progress.total}`;
  };

  return (
    <div className="role-select">
      <div className="role-select__inner">
        <div className="role-select__hero">
          <div className="row" style={{ justifyContent: 'center', marginBottom: 14 }}>
            <div className="logo-orbit">
              <span className="logo-orbit__ring" />
              <span className="logo-orbit__dot" />
              <span className="topbar__logo" style={{ width: 52, height: 52 }}>
                <Rocket size={24} />
              </span>
            </div>
          </div>
          <h1>Launch Lab 21</h1>
          <p className="tagline">
            Пройди модули — <em>one-pager соберётся сам</em>
          </p>
          <p className="muted small mt-1">
            Прототип без авторизации: выберите, от чьего имени смотреть платформу. Роль сохраняется при перезагрузке.
          </p>
        </div>

        <div className="role-cards">
          <section className="role-card role-card--peer" onMouseMove={onSpotlightMove}>
            <div className="role-card__icon">
              <UserRound size={22} />
            </div>
            <h2>Я — команда стартапа</h2>
            <p>Прохожу модули программы, заполняю шаблоны, смотрю свой one-pager.</p>
            <ul>
              <li>
                <Check size={14} /> Вижу и редактирую только свой проект
              </li>
              <li>
                <Check size={14} /> Сохраняю ответы и черновики, получаю комментарии куратора
              </li>
              <li>
                <Check size={14} /> One-pager собирается автоматически из моих ответов
              </li>
            </ul>
            <div className="actor-list">
              {peers.map((a) => (
                <button key={a.id} className="actor-btn" onClick={() => login(a)}>
                  <span className="actor-btn__avatar">
                    <Initials name={a.name.replace('Команда ', '')} />
                  </span>
                  <span>
                    <div className="actor-btn__name">{a.name}</div>
                    <div className="actor-btn__meta">{projectMeta(a)}</div>
                  </span>
                  <ArrowRight size={16} className="actor-btn__right" />
                </button>
              ))}
            </div>
          </section>

          <section className="role-card role-card--curator" onMouseMove={onSpotlightMove}>
            <div className="role-card__icon">
              <ShieldCheck size={22} />
            </div>
            <h2>Я — куратор инкубатора</h2>
            <p>Вижу все команды и их прогресс, комментирую ответы, управляю контентом модулей.</p>
            <ul>
              <li>
                <Check size={14} /> Общий дашборд всех проектов с % прохождения
              </li>
              <li>
                <Check size={14} /> Просмотр любых ответов (read-only) и комментарии к модулям
              </li>
              <li>
                <Check size={14} /> Редактирование заданий, полей и подсказок для всех команд
              </li>
            </ul>
            <div className="actor-list">
              {curators.map((a) => (
                <button key={a.id} className="actor-btn" onClick={() => login(a)}>
                  <span className="actor-btn__avatar">
                    <Initials name={a.name} />
                  </span>
                  <span>
                    <div className="actor-btn__name">{a.name}</div>
                    <div className="actor-btn__meta">
                      Куратор программы · {state.projects.length} {state.projects.length === 1 ? 'команда' : state.projects.length < 5 ? 'команды' : 'команд'} в
                      инкубаторе
                    </div>
                  </span>
                  <ArrowRight size={16} className="actor-btn__right" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
