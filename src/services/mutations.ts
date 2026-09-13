import { assertAccess, type AccessContext } from '../access/canAccess';
import type {
  Actor,
  ActivityEvent,
  AppState,
  CuratorComment,
  ModuleAnswer,
  ModuleTemplate,
  Project,
  TeamMember,
} from '../types';
import { findAnswer, getModuleStatus, validateModuleAnswer } from './modules';

export const makeId = (prefix: string): string => {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
};

const ctxOf = (state: AppState): AccessContext => ({ curatorPermissions: state.curatorPermissions });

const pushActivity = (state: AppState, event: Omit<ActivityEvent, 'id' | 'createdAt'>, now: string): ActivityEvent[] => [
  ...state.activity,
  { ...event, id: makeId('act'), createdAt: now },
];

export interface CreateProjectInput {
  name: string;
  hook: string;
  category: string;
  description: string;
  team: TeamMember[];
}

/** Пир с projectId, указывающим на несуществующий проект (битые данные), трактуется как пир без проекта. */
export function sanitizeActor(state: Pick<AppState, 'projects'>, actor: Actor): Actor {
  if (actor.role === 'peer' && actor.projectId && !state.projects.some((p) => p.id === actor.projectId)) {
    return { ...actor, projectId: undefined };
  }
  return actor;
}

export function createProject(state: AppState, rawActor: Actor, input: CreateProjectInput, now = new Date().toISOString()): AppState {
  const actor = sanitizeActor(state, rawActor);
  assertAccess(actor, 'project:create', null, ctxOf(state));
  const name = input.name.trim();
  if (!name) throw new Error('Название проекта обязательно');

  const project: Project = {
    id: makeId('p'),
    name,
    hook: input.hook.trim(),
    category: input.category.trim() || 'Без категории',
    description: input.description.trim(),
    team: input.team.map((m) => ({ name: m.name.trim(), role: m.role.trim() })).filter((m) => m.name),
    createdAt: now,
    updatedAt: now,
  };

  const updatedActor: Actor = { ...actor, projectId: project.id };
  return {
    ...state,
    actor: updatedActor,
    peerProjects: { ...state.peerProjects, [actor.id]: project.id },
    projects: [...state.projects, project],
    activity: pushActivity(
      state,
      { type: 'project_created', projectId: project.id, text: `Проект «${project.name}» создан`, actorName: actor.name },
      now,
    ),
  };
}

export function updateProject(state: AppState, actor: Actor, projectId: string, patch: Partial<CreateProjectInput>, now = new Date().toISOString()): AppState {
  assertAccess(actor, 'project:edit', projectId, ctxOf(state));
  const existing = state.projects.find((p) => p.id === projectId);
  if (!existing) throw new Error('Проект не найден');
  const name = (patch.name ?? existing.name).trim();
  if (!name) throw new Error('Название проекта обязательно');

  const updated: Project = {
    ...existing,
    name,
    hook: (patch.hook ?? existing.hook).trim(),
    category: (patch.category ?? existing.category).trim() || 'Без категории',
    description: (patch.description ?? existing.description).trim(),
    team: (patch.team ?? existing.team).map((m) => ({ name: m.name.trim(), role: m.role.trim() })).filter((m) => m.name),
    updatedAt: now,
  };
  return {
    ...state,
    projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
    activity: pushActivity(state, { type: 'project_updated', projectId, text: 'Профиль проекта обновлён', actorName: actor.name }, now),
  };
}

export function saveModuleAnswer(
  state: AppState,
  actor: Actor,
  projectId: string,
  moduleTemplateId: string,
  values: Record<string, string>,
  now = new Date().toISOString(),
): AppState {
  assertAccess(actor, 'answer:edit', projectId, ctxOf(state));
  const template = state.templates.find((t) => t.id === moduleTemplateId);
  if (!template) throw new Error('Модуль не найден');
  if (!state.projects.some((p) => p.id === projectId)) throw new Error('Проект не найден');

  // Сохраняем только значения по ключам шаблона — мусор от удалённых полей не накапливается
  const cleanValues: Record<string, string> = {};
  for (const f of template.fields) cleanValues[f.key] = (values[f.key] ?? '').trim();

  const { status } = validateModuleAnswer(template, cleanValues);
  const prev = findAnswer(state.answers, projectId, moduleTemplateId);
  const prevStatus = prev ? getModuleStatus(template, prev) : 'not_started';

  const nextAnswer: ModuleAnswer = {
    id: prev?.id ?? `${projectId}__${moduleTemplateId}`,
    projectId,
    moduleTemplateId,
    values: cleanValues,
    status,
    updatedAt: now,
  };

  const answers = prev
    ? state.answers.map((a) => (a.id === prev.id ? nextAnswer : a))
    : [...state.answers, nextAnswer];

  const justCompleted = status === 'completed' && prevStatus !== 'completed';
  const activity = pushActivity(
    state,
    {
      type: justCompleted ? 'module_completed' : 'answer_saved',
      projectId,
      text: justCompleted
        ? `Модуль «${template.title}» завершён`
        : status === 'completed'
          ? `Ответ модуля «${template.title}» обновлён`
          : `Черновик модуля «${template.title}» сохранён`,
      actorName: actor.name,
    },
    now,
  );

  return {
    ...state,
    answers,
    projects: state.projects.map((p) => (p.id === projectId ? { ...p, updatedAt: now } : p)),
    activity,
  };
}

export function addCuratorComment(
  state: AppState,
  actor: Actor,
  projectId: string,
  moduleTemplateId: string,
  text: string,
  now = new Date().toISOString(),
): AppState {
  assertAccess(actor, 'comment:create', projectId, ctxOf(state));
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Комментарий не может быть пустым');
  const template = state.templates.find((t) => t.id === moduleTemplateId);
  if (!template) throw new Error('Модуль не найден');
  if (!state.projects.some((p) => p.id === projectId)) throw new Error('Проект не найден');

  const comment: CuratorComment = {
    id: makeId('c'),
    projectId,
    moduleTemplateId,
    text: trimmed,
    author: actor.name,
    createdAt: now,
  };
  return {
    ...state,
    comments: [...state.comments, comment],
    activity: pushActivity(
      state,
      { type: 'comment_added', projectId, text: `Куратор оставил комментарий к модулю «${template.title}»`, actorName: actor.name },
      now,
    ),
  };
}

export function updateModuleTemplate(state: AppState, actor: Actor, template: ModuleTemplate, now = new Date().toISOString()): AppState {
  assertAccess(actor, 'template:edit', null, ctxOf(state));
  if (!state.templates.some((t) => t.id === template.id)) throw new Error('Модуль не найден');
  if (!template.title.trim()) throw new Error('Название модуля обязательно');
  if (template.fields.length === 0) throw new Error('У модуля должно быть хотя бы одно поле');

  const keys = template.fields.map((f) => f.key.trim());
  if (keys.some((k) => !k)) throw new Error('У каждого поля должен быть ключ');
  if (new Set(keys).size !== keys.length) throw new Error('Ключи полей должны быть уникальны');
  if (template.fields.some((f) => !f.label.trim())) throw new Error('У каждого поля должно быть название');

  const cleaned: ModuleTemplate = {
    ...template,
    title: template.title.trim(),
    description: template.description.trim(),
    guidance: template.guidance.trim(),
    fields: template.fields.map((f) => ({ ...f, key: f.key.trim(), label: f.label.trim() })),
  };

  // Изменение обязательности/состава полей влияет на статус ответов всех команд — пересчитываем
  const answers = state.answers.map((a) =>
    a.moduleTemplateId === cleaned.id ? { ...a, status: validateModuleAnswer(cleaned, a.values).status } : a,
  );

  return {
    ...state,
    templates: state.templates.map((t) => (t.id === cleaned.id ? cleaned : t)),
    answers,
    activity: pushActivity(
      state,
      { type: 'template_updated', projectId: null, text: `Контент модуля «${cleaned.title}» обновлён`, actorName: actor.name },
      now,
    ),
  };
}

export function updateCuratorPermissions(state: AppState, actor: Actor, patch: Partial<AppState['curatorPermissions']>): AppState {
  assertAccess(actor, 'permissions:edit', null, ctxOf(state));
  return { ...state, curatorPermissions: { ...state.curatorPermissions, ...patch } };
}
