import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import type { Role } from '../types';
import { useApp } from '../state/AppContext';
import { canAccess, type AccessAction } from '../access/canAccess';

/** Экран отказа в доступе — вместо молчаливого редиректа, чтобы на демо было наглядно видно изоляцию ролей. */
export function AccessDenied({ title, reason }: { title?: string; reason?: string }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const home = state.actor?.role === 'curator' ? '/curator' : '/peer';
  return (
    <main className="page page--narrow">
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <ShieldAlert size={40} style={{ color: 'var(--danger)', marginBottom: 12 }} />
        <h2>{title ?? 'Доступ запрещён'}</h2>
        <p className="muted mt-1">
          {reason ??
            'Слой доступа canAccess() отклонил запрос: у текущей роли нет прав на эту сущность. Данные не были загружены.'}
        </p>
        <div className="row mt-3" style={{ justifyContent: 'center' }}>
          <button className="btn btn--primary" onClick={() => navigate(home)}>
            На главную
          </button>
          <button className="btn" onClick={() => navigate('/')}>
            Сменить роль
          </button>
        </div>
      </div>
    </main>
  );
}

/** Секция маршрутов доступна только заданной роли. Без актора — на экран выбора роли. */
export function RequireRole({ role }: { role: Role }) {
  const { state } = useApp();
  if (!state.actor) return <Navigate to="/" replace />;
  if (state.actor.role !== role) {
    return (
      <AccessDenied
        title={role === 'curator' ? 'Только для куратора' : 'Только для команды'}
        reason={
          role === 'curator'
            ? 'Вы вошли как команда. Общий дашборд, чужие проекты и контент модулей доступны только куратору.'
            : 'Вы вошли как куратор. Рабочее пространство команды доступно только роли «Команда».'
        }
      />
    );
  }
  return <Outlet />;
}

/** Проверка конкретного действия над конкретным проектом (для глубоких ссылок). */
export function RequireAccess({
  action,
  projectId,
  children,
}: {
  action: AccessAction;
  projectId?: string | null;
  children: React.ReactNode;
}) {
  const { state } = useApp();
  if (!state.actor) return <Navigate to="/" replace />;
  const ok = canAccess(state.actor, action, projectId, { curatorPermissions: state.curatorPermissions });
  if (!ok) {
    return (
      <AccessDenied
        reason={`Действие «${action}» для проекта «${projectId ?? '—'}» отклонено слоем доступа. Роль «${
          state.actor.role === 'curator' ? 'куратор' : 'команда'
        }» ${state.actor.role === 'peer' ? 'видит только свой проект.' : 'не имеет такого права.'}`}
      />
    );
  }
  return <>{children}</>;
}

export function NotFound({ what = 'Страница' }: { what?: string }) {
  const navigate = useNavigate();
  return (
    <main className="page page--narrow">
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <Lock size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
        <h2>{what} не найдена</h2>
        <p className="muted mt-1">Возможно, ссылка устарела или объект был удалён.</p>
        <button className="btn btn--primary mt-3" onClick={() => navigate('/')}>
          На главную
        </button>
      </div>
    </main>
  );
}
