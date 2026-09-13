import { useMemo, type CSSProperties, type MouseEvent } from 'react';

const prand = (i: number, salt: number): number => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const STAR_COLORS = ['#e8edf7', '#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];

/**
 * Декоративный слой: зерно, сетка, звёзды, орбы. Не ловит клики, не влияет на данные.
 */
export function AmbientBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 52 }, (_, i) => ({
        id: i,
        left: `${prand(i, 1) * 100}%`,
        top: `${prand(i, 2) * 100}%`,
        size: 1 + prand(i, 3) * 2.4,
        delay: `${prand(i, 4) * 5}s`,
        dur: `${2.2 + prand(i, 5) * 3.4}s`,
        color: STAR_COLORS[i % STAR_COLORS.length],
      })),
    [],
  );

  return (
    <div className="ambient" aria-hidden>
      <div className="ambient__mesh" />
      <div className="ambient__grain" />
      {stars.map((s) => (
        <span
          key={s.id}
          className="ambient__star"
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              background: s.color,
              '--d': s.delay,
              '--dur': s.dur,
            } as CSSProperties
          }
        />
      ))}
      <span className="ambient__orb ambient__orb--a" />
      <span className="ambient__orb ambient__orb--b" />
      <span className="ambient__orb ambient__orb--c" />
    </div>
  );
}

/** Следящий блик на карточке роли — только визуал, без состояния приложения. */
export function onSpotlightMove(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}
