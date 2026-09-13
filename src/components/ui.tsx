import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  Circle,
  CircleDashed,
  Coins,
  FileText,
  HandCoins,
  Lightbulb,
  Map,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AnswerStatus } from '../types';
import type { ModuleVisualState } from '../services/modules';

const ICONS: Record<string, LucideIcon> = {
  AlertCircle,
  Lightbulb,
  Users,
  Coins,
  BarChart3,
  UsersRound,
  TrendingUp,
  Map,
  HandCoins,
  FileText,
};

export function ModuleIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? FileText;
  return <Icon size={size} />;
}

export const STATUS_LABEL: Record<AnswerStatus, string> = {
  not_started: 'Не начат',
  in_progress: 'Черновик',
  completed: 'Завершён',
};

export function StatusBadge({ status, current = false }: { status: AnswerStatus; current?: boolean }) {
  if (status === 'completed') {
    return (
      <span className="badge badge--completed">
        <CheckCircle2 size={13} /> Пройден
      </span>
    );
  }
  if (current) {
    return (
      <span className="badge badge--current">
        <Sparkles size={13} /> Следующий шаг
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="badge badge--in_progress">
        <CircleDashed size={13} /> Черновик
      </span>
    );
  }
  return (
    <span className="badge badge--not_started">
      <Circle size={13} /> Не начат
    </span>
  );
}

export function visualStateLabel(state: ModuleVisualState): string {
  switch (state) {
    case 'completed':
      return 'Пройден';
    case 'current':
      return 'Текущий — следующий шаг';
    case 'in_progress':
      return 'Черновик';
    case 'not_started':
      return 'Не начат';
  }
}

interface RingProps {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: ReactNode;
  success?: boolean;
}

export function ProgressRing({ value, size = 88, stroke = 8, label, success }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  return (
    <div className={`ring ${success ? 'ring--success' : ''}`} style={{ width: size, height: size }} role="img" aria-label={`Прогресс ${clamped}%`}>
      <svg width={size} height={size}>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring__label" style={{ fontSize: size >= 80 ? 20 : 14 }}>
        {label ?? (
          <span>
            {clamped}%
          </span>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ value, success }: { value: number; success?: boolean }) {
  return (
    <div className={`progress-bar ${success ? 'progress-bar--success' : ''}`}>
      <div className="progress-bar__fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const text = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return <>{text.toUpperCase() || '?'}</>;
}

export function CheckIcon() {
  return <Check size={14} />;
}

export function formatDate(iso: string, withTime = false): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  } catch {
    return iso;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} дн назад`;
  return formatDate(iso);
}

export function pluralModules(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} модуль`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} модуля`;
  return `${n} модулей`;
}
