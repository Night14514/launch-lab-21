import type { Actor, AppState, ModuleTemplate, Theme } from '../types';
import {
  addCuratorComment,
  createProject,
  sanitizeActor,
  saveModuleAnswer,
  updateCuratorPermissions,
  updateModuleTemplate,
  updateProject,
  type CreateProjectInput,
} from '../services/mutations';
import { createSeedState } from './persistence';

export type AppAction =
  | { type: 'LOGIN'; actor: Actor }
  | { type: 'LOGOUT' }
  | { type: 'CREATE_PROJECT'; input: CreateProjectInput }
  | { type: 'UPDATE_PROJECT'; projectId: string; patch: Partial<CreateProjectInput> }
  | { type: 'SAVE_ANSWER'; projectId: string; moduleTemplateId: string; values: Record<string, string> }
  | { type: 'ADD_COMMENT'; projectId: string; moduleTemplateId: string; text: string }
  | { type: 'UPDATE_TEMPLATE'; template: ModuleTemplate }
  | { type: 'SET_PERMISSIONS'; patch: Partial<AppState['curatorPermissions']> }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_DEMO' };

let errorSeq = 0;

function requireActor(state: AppState): Actor {
  if (!state.actor) throw new Error('Сначала выберите роль');
  return state.actor;
}

function apply(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN': {
      // Пир, который ранее создал проект в этой сессии, получает его обратно
      const remembered = state.peerProjects[action.actor.id];
      const withRemembered: Actor =
        action.actor.role === 'peer' && !action.actor.projectId && remembered
          ? { ...action.actor, projectId: remembered }
          : action.actor;
      return { ...state, actor: sanitizeActor(state, withRemembered), lastError: null };
    }
    case 'LOGOUT':
      return { ...state, actor: null, lastError: null };
    case 'CREATE_PROJECT':
      return createProject(state, requireActor(state), action.input);
    case 'UPDATE_PROJECT':
      return updateProject(state, requireActor(state), action.projectId, action.patch);
    case 'SAVE_ANSWER':
      return saveModuleAnswer(state, requireActor(state), action.projectId, action.moduleTemplateId, action.values);
    case 'ADD_COMMENT':
      return addCuratorComment(state, requireActor(state), action.projectId, action.moduleTemplateId, action.text);
    case 'UPDATE_TEMPLATE':
      return updateModuleTemplate(state, requireActor(state), action.template);
    case 'SET_PERMISSIONS':
      return updateCuratorPermissions(state, requireActor(state), action.patch);
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'CLEAR_ERROR':
      return state.lastError ? { ...state, lastError: null } : state;
    case 'RESET_DEMO':
      return { ...createSeedState(), theme: state.theme };
  }
}

/** Редьюсер никогда не бросает: любая ошибка сервисного слоя превращается в lastError и показывается тостом. */
export function appReducer(state: AppState, action: AppAction): AppState {
  try {
    const next = apply(state, action);
    return next.lastError ? { ...next, lastError: null } : next;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    console.warn('[reducer]', action.type, message);
    return { ...state, lastError: { id: ++errorSeq, message } };
  }
}
