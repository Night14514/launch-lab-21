import type { AnswerStatus, ModuleAnswer, ModuleTemplate, TemplateField } from '../types';

export const normalizeValue = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export const isFilled = (value: unknown): boolean => normalizeValue(value).length > 0;

export interface ValidationResult {
  /** Обязательные поля, которые ещё пусты */
  missingRequired: TemplateField[];
  /** Заполненные поля (любые) */
  filledCount: number;
  /** Вообще ничего не введено */
  isEmpty: boolean;
  status: AnswerStatus;
}

/**
 * Валидация ответа по шаблону модуля.
 * - пусто везде → not_started
 * - есть хоть что-то, но не все обязательные → in_progress (черновик)
 * - все обязательные заполнены → completed
 */
export function validateModuleAnswer(template: ModuleTemplate, values: Record<string, string>): ValidationResult {
  const missingRequired = template.fields.filter((f) => f.required && !isFilled(values[f.key]));
  const filledCount = template.fields.filter((f) => isFilled(values[f.key])).length;
  const isEmpty = filledCount === 0;
  const status: AnswerStatus = isEmpty ? 'not_started' : missingRequired.length === 0 ? 'completed' : 'in_progress';
  return { missingRequired, filledCount, isEmpty, status };
}

export function getModuleStatus(template: ModuleTemplate, answer: ModuleAnswer | undefined): AnswerStatus {
  if (!answer) return 'not_started';
  return validateModuleAnswer(template, answer.values).status;
}

export const sortTemplates = (templates: ModuleTemplate[]): ModuleTemplate[] =>
  [...templates].sort((a, b) => a.order - b.order);

export function findAnswer(answers: ModuleAnswer[], projectId: string, moduleTemplateId: string): ModuleAnswer | undefined {
  return answers.find((a) => a.projectId === projectId && a.moduleTemplateId === moduleTemplateId);
}

export interface ProgressInfo {
  completed: number;
  inProgress: number;
  total: number;
  percent: number;
  remaining: ModuleTemplate[];
  completedModules: ModuleTemplate[];
}

export function computeOverallProgress(projectId: string, templates: ModuleTemplate[], answers: ModuleAnswer[]): ProgressInfo {
  const ordered = sortTemplates(templates);
  const completedModules: ModuleTemplate[] = [];
  const remaining: ModuleTemplate[] = [];
  let inProgress = 0;
  for (const t of ordered) {
    const status = getModuleStatus(t, findAnswer(answers, projectId, t.id));
    if (status === 'completed') completedModules.push(t);
    else {
      remaining.push(t);
      if (status === 'in_progress') inProgress += 1;
    }
  }
  const total = ordered.length;
  const completed = completedModules.length;
  return {
    completed,
    inProgress,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    remaining,
    completedModules,
  };
}

/** Текущий модуль — первый по порядку, который ещё не завершён. null → программа пройдена целиком. */
export function getCurrentModule(projectId: string, templates: ModuleTemplate[], answers: ModuleAnswer[]): ModuleTemplate | null {
  for (const t of sortTemplates(templates)) {
    if (getModuleStatus(t, findAnswer(answers, projectId, t.id)) !== 'completed') return t;
  }
  return null;
}

export type ModuleVisualState = 'completed' | 'current' | 'in_progress' | 'not_started';

/** Третье визуальное состояние «текущий» поверх статуса ответа (чек-лист MVP, п.2). */
export function getModuleVisualState(
  template: ModuleTemplate,
  status: AnswerStatus,
  currentModuleId: string | null,
): ModuleVisualState {
  if (status === 'completed') return 'completed';
  if (template.id === currentModuleId) return 'current';
  return status;
}

export const splitList = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
