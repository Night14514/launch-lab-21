import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Rocket,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useToast } from '../components/Toast';
import { canAccess } from '../access/canAccess';

export function AppShell() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const actor = state.actor;
  const isCurator = actor?.role === 'curator';

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const resetDemo = () => {
    if (!window.confirm('Сбросить все данные к демо-состоянию? Созданные проекты и ответы будут удалены.')) return;
    dispatch({ type: 'RESET_DEMO' });
    toast.info('Демо-данные восстановлены');
    navigate('/');
  };

  const canSeeDashboard = canAccess(actor, 'dashboard:read', null, { curatorPermissions: state.curatorPermissions });
  const canSeeTemplates = canAccess(actor, 'template:read', null, { curatorPermissions: state.curatorPermissions });

  return (
    <div className="app-shell" data-role={actor?.role ?? 'peer'}>
      <header className="topbar">
        <NavLink to={isCurator ? '/curator' : '/peer'} className="topbar__brand">
          <span className="topbar__logo topbar__logo--live">
            <Rocket size={18} />
          </span>
          <span>
            Launch Lab 21
            <small>{isCurator ? 'Панель куратора' : 'Рабочее пространство команды'}</small>
          </span>
        </NavLink>

        <nav className="nav">
          {isCurator ? (
            <>
              {canSeeDashboard && (
                <NavLink to="/curator" end className="nav__link">
                  <LayoutDashboard size={16} /> Все команды
                </NavLink>
              )}
              {canSeeTemplates && (
                <NavLink to="/curator/templates" className="nav__link">
                  <Settings2 size={16} /> Контент модулей
                </NavLink>
              )}
              <NavLink to="/curator/activity" className="nav__link">
                <Activity size={16} /> Активность
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/peer" end className="nav__link">
                <LayoutDashboard size={16} /> Мой проект
              </NavLink>
              <NavLink to="/peer/onepager" className="nav__link">
                <FileText size={16} /> One-pager
              </NavLink>
              <NavLink to="/peer/activity" className="nav__link">
                <Activity size={16} /> Активность
              </NavLink>
            </>
          )}
        </nav>

        <div className="topbar__right">
          {actor && (
            <span className="role-badge" title={`Роль: ${isCurator ? 'куратор' : 'команда'}`}>
              <span className="role-badge__dot" />
              {isCurator ? <ShieldCheck size={14} /> : <UserRound size={14} />}
              {isCurator ? 'Куратор' : 'Команда'}
              <small>· {actor.name}</small>
            </span>
          )}
          <button
            className="btn btn--ghost btn--icon"
            title={state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            onClick={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })}
          >
            {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="btn btn--ghost btn--icon" title="Сбросить демо-данные" onClick={resetDemo}>
            <RotateCcw size={16} />
          </button>
          <button className="btn btn--sm" onClick={logout}>
            <LogOut size={14} /> Сменить роль
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
