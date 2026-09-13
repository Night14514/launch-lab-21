import { canAccess, type AccessContext } from '../access/canAccess';
import type { ActivityEvent, AppState, CuratorComment, ModuleAnswer, Project } from '../types';

const ctxOf = (state: AppState): AccessContext => ({ curatorPermissions: state.curatorPermissions });

/** Проекты, которые актор имеет право видеть. Пир получит максимум один — свой. */
export function selectVisibleProjects(state: AppState): Project[] {
  return state.projects.filter((p) => canAccess(state.actor, 'project:read', p.id, ctxOf(state)));
}

export function selectProject(state: AppState, projectId: string | undefined | null): Project | null {
  if (!projectId) return null;
  if (!canAccess(state.actor, 'project:read', projectId, ctxOf(state))) return null;
  return state.projects.find((p) => p.id === projectId) ?? null;
}

/** Проект текущего пира (или null, если ещё не создан / актор не пир). */
export function selectMyProject(state: AppState): Project | null {
  if (state.actor?.role !== 'peer') return null;
  return selectProject(state, state.actor.projectId);
}

export function selectAnswers(state: AppState, projectId: string): ModuleAnswer[] {
  if (!canAccess(state.actor, 'answer:read', projectId, ctxOf(state))) return [];
  return state.answers.filter((a) => a.projectId === projectId);
}

export function selectComments(state: AppState, projectId: string, moduleTemplateId?: string): CuratorComment[] {
  if (!canAccess(state.actor, 'comment:read', projectId, ctxOf(state))) return [];
  return state.comments
    .filter((c) => c.projectId === projectId && (!moduleTemplateId || c.moduleTemplateId === moduleTemplateId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Лента активности: пир — только своя, куратор — по всем проектам + системные события (projectId === null). */
export function selectActivity(state: AppState, projectId?: string): ActivityEvent[] {
  const ctx = ctxOf(state);
  return state.activity
    .filter((e) => {
      if (projectId && e.projectId !== projectId) return false;
      if (e.projectId === null) return state.actor?.role === 'curator';
      return canAccess(state.actor, 'activity:read', e.projectId, ctx);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const selectCan = (state: AppState, action: Parameters<typeof canAccess>[1], projectId?: string | null): boolean =>
  canAccess(state.actor, action, projectId, ctxOf(state));
