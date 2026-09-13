import { DEFAULT_CURATOR_PERMISSIONS } from '../access/canAccess';
import { MOCK_ACTIVITY, MOCK_ANSWERS, MOCK_COMMENTS, MOCK_PROJECTS } from '../data/mockData';
import { MODULE_TEMPLATES } from '../data/moduleTemplates';
import { sanitizeActor } from '../services/mutations';
import type { AppState } from '../types';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'launch-lab-21:state';

interface PersistedEnvelope {
  version: number;
  savedAt: string;
  state: AppState;
}

export function createSeedState(): AppState {
  return {
    actor: null,
    peerProjects: {},
    projects: structuredClone(MOCK_PROJECTS),
    templates: structuredClone(MODULE_TEMPLATES),
    answers: structuredClone(MOCK_ANSWERS),
    comments: structuredClone(MOCK_COMMENTS),
    activity: structuredClone(MOCK_ACTIVITY),
    curatorPermissions: { ...DEFAULT_CURATOR_PERMISSIONS },
    theme: 'dark',
  };
}

const isArray = Array.isArray;

/** Минимальная проверка формы состояния — защита от повреждённого localStorage. */
function isValidState(candidate: unknown): candidate is AppState {
  if (!candidate || typeof candidate !== 'object') return false;
  const s = candidate as Partial<AppState>;
  return (
    isArray(s.projects) &&
    isArray(s.templates) &&
    isArray(s.answers) &&
    isArray(s.comments) &&
    isArray(s.activity) &&
    typeof s.peerProjects === 'object' &&
    s.peerProjects !== null &&
    typeof s.curatorPermissions === 'object' &&
    s.curatorPermissions !== null
  );
}

export function loadState(): AppState {
  const seed = createSeedState();
  if (typeof window === 'undefined') return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const envelope = JSON.parse(raw) as Partial<PersistedEnvelope>;
    if (envelope.version !== SCHEMA_VERSION || !isValidState(envelope.state)) {
      // Несовместимая схема — начинаем с сида, чтобы не падать на демо
      window.localStorage.removeItem(STORAGE_KEY);
      return seed;
    }
    const merged: AppState = {
      ...seed,
      ...envelope.state,
      curatorPermissions: { ...seed.curatorPermissions, ...envelope.state.curatorPermissions },
      theme: envelope.state.theme === 'light' ? 'light' : 'dark',
      lastError: null,
    };
    return { ...merged, actor: merged.actor ? sanitizeActor(merged, merged.actor) : null };
  } catch {
    return seed;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    const { lastError: _omit, ...persisted } = state;
    void _omit;
    const envelope: PersistedEnvelope = { version: SCHEMA_VERSION, savedAt: new Date().toISOString(), state: persisted };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (err) {
    console.error('Не удалось сохранить состояние', err);
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
