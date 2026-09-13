import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import type { OnePager } from '../types';
import { formatDate, moduleStyle } from './ui';

const WIDE_SECTIONS = new Set([1, 2, 9]);

/**
 * «Бумажный» документ one-pager. Чистое представление результата assembleOnePager —
 * никакого собственного состояния, никакого ввода.
 */
export function OnePagerDocument({ onePager }: { onePager: OnePager }) {
  const { project, sections, readyCount, totalCount, lastUpdatedAt } = onePager;
  const full = readyCount === totalCount && totalCount > 0;

  return (
    <article className="paper" id="one-pager">
      <header className="paper__head">
        <div>
          <div className="paper__category">{project.category || 'Стартап'}</div>
          <h1 className="paper__title">{project.name}</h1>
          {project.hook && <p className="paper__hook">{project.hook}</p>}
          {project.description && <p className="paper__desc">{project.description}</p>}
          {project.team.length > 0 && (
            <div className="paper__team">
              {project.team.map((m, i) => (
                <div key={`${m.name}-${i}`}>
                  <b>{m.name}</b> {m.role && <span>· {m.role}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="paper__meta">
          <span className={`paper__ready ${full ? 'paper__ready--full' : ''}`}>
            {full ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
            {readyCount}/{totalCount} разделов готово
          </span>
          <span>
            <Clock size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Обновлён {formatDate(lastUpdatedAt, true)}
          </span>
          <span>Launch Lab 21 · School 21</span>
        </div>
      </header>

      <div className="paper__grid">
        {sections.map((s, i) => (
          <section
            key={s.moduleId}
            className={`paper-section ${WIDE_SECTIONS.has(s.order) ? 'paper-section--wide' : ''}`}
            style={moduleStyle(s.order, i)}
          >
            <div className="paper-section__head">
              <span className="paper-section__num">{s.order}</span>
              <span className="paper-section__title">{s.title}</span>
              {s.status === 'completed' && (
                <span className="paper-section__status" title="Раздел готов">
                  <CheckCircle2 size={14} />
                </span>
              )}
              {s.status === 'in_progress' && (
                <span className="paper-section__status paper-section__status--draft" title="Черновик">
                  <CircleDashed size={14} />
                </span>
              )}
            </div>

            {s.blocks.length === 0 ? (
              <div className="paper-placeholder">Раздел появится автоматически, когда команда заполнит модуль «{s.title}».</div>
            ) : (
              s.blocks.map((b) => (
                <div key={b.label} className="paper-block">
                  <div className="paper-block__label">{b.label}</div>
                  {b.kind === 'list' ? (
                    <ul className="paper-block__list">
                      {b.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  ) : b.kind === 'number' ? (
                    <div className="paper-block__number">{b.value}</div>
                  ) : (
                    <p className="paper-block__text">{b.value}</p>
                  )}
                </div>
              ))
            )}
          </section>
        ))}
      </div>

      <footer className="paper__footer">
        <span>Собрано автоматически из ответов модулей программы Launch Lab 21</span>
        <span>{new Date().getFullYear()} · School 21</span>
      </footer>
    </article>
  );
}
