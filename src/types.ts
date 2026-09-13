export type Role = 'peer' | 'curator';

/** Актор текущей сессии. Для peer обязателен projectId (или undefined, если проект ещё не создан). */
export interface Actor {
  id: string;
  name: string;
  role: Role;
  projectId?: string;
}

export interface TeamMember {
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  hook: string;
  category: string;
  description: string;
  team: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export type FieldType = 'text' | 'textarea' | 'list' | 'number';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  hint: string;
  required: boolean;
}

export interface ModuleTemplate {
  id: string;
  order: number;
  title: string;
  /** Короткое описание задания */
  description: string;
  /** Развёрнутая подсказка / пример хорошего ответа */
  guidance: string;
  icon: string;
  fields: TemplateField[];
}

export type AnswerStatus = 'not_started' | 'in_progress' | 'completed';

export interface ModuleAnswer {
  id: string;
  projectId: string;
  moduleTemplateId: string;
  values: Record<string, string>;
  status: AnswerStatus;
  updatedAt: string;
}

export interface CuratorComment {
  id: string;
  projectId: string;
  moduleTemplateId: string;
  text: string;
  author: string;
  createdAt: string;
}

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'answer_saved'
  | 'module_completed'
  | 'comment_added'
  | 'template_updated';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  projectId: string | null;
  createdAt: string;
  text: string;
  actorName: string;
}

export interface CuratorPermissions {
  canEditTemplates: boolean;
  canComment: boolean;
}

export type Theme = 'dark' | 'light';

export interface AppState {
  actor: Actor | null;
  /** Актор-пир без проекта после создания проекта получает projectId — храним карту actorId → projectId */
  peerProjects: Record<string, string>;
  projects: Project[];
  templates: ModuleTemplate[];
  answers: ModuleAnswer[];
  comments: CuratorComment[];
  activity: ActivityEvent[];
  curatorPermissions: CuratorPermissions;
  theme: Theme;
  /** Транзиентная ошибка последней операции (не персистится) */
  lastError?: { id: number; message: string } | null;
}

/** Секция one-pager — вычисляемая сущность */
export interface OnePagerBlock {
  label: string;
  kind: 'paragraph' | 'list' | 'number';
  value: string;
  items: string[];
}

export interface OnePagerSection {
  moduleId: string;
  order: number;
  title: string;
  icon: string;
  status: AnswerStatus;
  isReady: boolean;
  blocks: OnePagerBlock[];
}

export interface OnePager {
  project: Project;
  sections: OnePagerSection[];
  readyCount: number;
  totalCount: number;
  lastUpdatedAt: string;
}
