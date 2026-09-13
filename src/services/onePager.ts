import type { ModuleAnswer, ModuleTemplate, OnePager, OnePagerBlock, OnePagerSection, Project } from '../types';
import { findAnswer, getModuleStatus, isFilled, sortTemplates, splitList } from './modules';

/**
 * Движок сборки one-pager: чистая производная от ответов модулей.
 * Никакого дублирования ввода — если ответ есть в модуле, он появляется здесь автоматически.
 */
export function assembleOnePager(project: Project, templates: ModuleTemplate[], answers: ModuleAnswer[]): OnePager {
  const ordered = sortTemplates(templates);
  let lastUpdatedAt = project.updatedAt;

  const sections: OnePagerSection[] = ordered.map((template) => {
    const answer = findAnswer(answers, project.id, template.id);
    const status = getModuleStatus(template, answer);
    if (answer && answer.updatedAt > lastUpdatedAt) lastUpdatedAt = answer.updatedAt;

    const blocks: OnePagerBlock[] = template.fields
      .filter((f) => answer && isFilled(answer.values[f.key]))
      .map((f) => {
        const raw = (answer?.values[f.key] ?? '').trim();
        if (f.type === 'list') {
          return { label: f.label, kind: 'list', value: raw, items: splitList(raw) };
        }
        if (f.type === 'number') {
          return { label: f.label, kind: 'number', value: raw, items: [] };
        }
        return { label: f.label, kind: 'paragraph', value: raw, items: [] };
      });

    return {
      moduleId: template.id,
      order: template.order,
      title: template.title,
      icon: template.icon,
      status,
      isReady: status === 'completed',
      blocks,
    };
  });

  return {
    project,
    sections,
    readyCount: sections.filter((s) => s.isReady).length,
    totalCount: sections.length,
    lastUpdatedAt,
  };
}
