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
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { AnswerStatus } from '../types';
import type { ModuleVisualState } from '../services/modules';

/** Цвет модуля по порядковому номеру (палитра --m1…--m9 в index.css, циклично). */
export const moduleColor = (order: number): string => `var(--m${((order - 1) % 9) + 1})`;

/** Инлайн-переменные для карточек/секций: цвет модуля и индекс для каскадной анимации. */
export const moduleStyle = (order: number, index?: number): CSSProperties =>
  ({ '--mc': moduleColor(order), ...(index !== undefined ? { '--i': index } : {}) }) as CSSProperties;

export const staggerStyle = (index: number): CSSProperties => ({ '--i': index }) as CSSProperties;

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
  const gradId = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  return (
    <div
      className={`ring ${success ? 'ring--success' : ''}`}
      style={{ width: size, height: size, '--ring-c': c } as CSSProperties}
      role="img"
      aria-label={`Прогресс ${clamped}%`}
    >
      {size >= 80 && <span className="ring__glow" />}
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            {success ? (
              <>
                <stop offset="0%" stopColor="var(--success)" />
                <stop offset="100%" stopColor="var(--m8)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--m5)" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke={`url(#${gradId})`}
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

const CONFETTI_COLORS = ['var(--m1)', 'var(--m2)', 'var(--m3)', 'var(--m4)', 'var(--m5)', 'var(--m6)', 'var(--m7)', 'var(--m8)', 'var(--m9)'];

/**
 * Залп конфетти из точки (в % от окна). Монтируется по ключу — каждый новый key = новый залп.
 * Чисто декоративный, pointer-events: none, сам исчезает после анимации.
 */
/** Детерминированный псевдослучайный [0,1) от индекса и соли — рендер остаётся чистым. */
const prand = (i: number, salt: number): number => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function ConfettiBurst({
  originX = 50,
  originY = 85,
  count = 28,
  seed = 1,
}: {
  originX?: number;
  originY?: number;
  count?: number;
  seed?: number;
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = Math.PI * (0.15 + prand(i, seed) * 0.7) * -1; // вверх, в веер
        const dist = 120 + prand(i, seed + 1) * 220;
        return {
          id: i,
          c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist + 160}px`,
          r: `${(prand(i, seed + 2) - 0.5) * 720}deg`,
          d: `${prand(i, seed + 3) * 120}ms`,
        };
      }),
    [count, seed],
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti__piece"
          style={{ '--x': `${originX}%`, '--y': `${originY}%`, '--c': p.c, '--dx': p.dx, '--dy': p.dy, '--r': p.r, '--d': p.d } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function pluralModules(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} модуль`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} модуля`;
  return `${n} модулей`;
}
