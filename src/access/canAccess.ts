import type { Actor, CuratorPermissions } from '../types';

/**
 * Все действия, которые может совершить актор над данными.
 * Любая проверка прав в приложении обязана идти через canAccess — никаких «если роль === curator» в компонентах.
 */
export type AccessAction =
  | 'project:read'
  | 'project:create'
  | 'project:edit'
  | 'answer:read'
  | 'answer:edit'
  | 'onepager:read'
  | 'comment:read'
  | 'comment:create'
  | 'activity:read'
  | 'dashboard:read'
  | 'template:read'
  | 'template:edit'
  | 'permissions:edit';

export interface AccessContext {
  /** Настраиваемые полномочия куратора (тумблеры в UI) */
  curatorPermissions: CuratorPermissions;
}

export const DEFAULT_CURATOR_PERMISSIONS: CuratorPermissions = {
  canEditTemplates: true,
  canComment: true,
};

/**
 * Централизованное решение о доступе.
 *
 * @param actor           текущий актор сессии (null — не вошёл)
 * @param action          что хочет сделать
 * @param targetProjectId проект, к которому относится сущность (для действий без проекта — undefined)
 * @param ctx             контекст с настраиваемыми полномочиями
 */
export function canAccess(
  actor: Actor | null | undefined,
  action: AccessAction,
  targetProjectId?: string | null,
  ctx: AccessContext = { curatorPermissions: DEFAULT_CURATOR_PERMISSIONS },
): boolean {
  if (!actor) return false;

  if (actor.role === 'curator') {
    switch (action) {
      case 'project:read':
      case 'answer:read':
      case 'onepager:read':
      case 'comment:read':
      case 'activity:read':
      case 'dashboard:read':
      case 'template:read':
      case 'permissions:edit':
        return true;
      case 'comment:create':
        return ctx.curatorPermissions.canComment;
      case 'template:edit':
        return ctx.curatorPermissions.canEditTemplates;
      // Куратор — наблюдатель и администратор программы, но не автор ответов команды
      case 'project:create':
      case 'project:edit':
      case 'answer:edit':
        return false;
    }
  }

  if (actor.role === 'peer') {
    // Пир без проекта может только создать его и читать шаблоны
    if (action === 'project:create') return !actor.projectId;
    if (action === 'template:read') return true;

    // Всё остальное — строго в границах СВОЕГО проекта
    const ownsTarget = Boolean(actor.projectId) && targetProjectId === actor.projectId;
    switch (action) {
      case 'project:read':
      case 'project:edit':
      case 'answer:read':
      case 'answer:edit':
      case 'onepager:read':
      case 'comment:read':
      case 'activity:read':
        return ownsTarget;
      case 'comment:create':
      case 'dashboard:read':
      case 'template:edit':
      case 'permissions:edit':
        return false;
    }
  }

  return false;
}

export class AccessDeniedError extends Error {
  constructor(action: AccessAction, targetProjectId?: string | null) {
    super(`Доступ запрещён: ${action}${targetProjectId ? ` → ${targetProjectId}` : ''}`);
    this.name = 'AccessDeniedError';
  }
}

/** Бросает исключение, если доступа нет. Используется сервисным слоем. */
export function assertAccess(
  actor: Actor | null | undefined,
  action: AccessAction,
  targetProjectId: string | null | undefined,
  ctx: AccessContext,
): void {
  if (!canAccess(actor, action, targetProjectId, ctx)) {
    throw new AccessDeniedError(action, targetProjectId);
  }
}
