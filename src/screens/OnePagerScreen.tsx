import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Presentation, Printer } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { selectAnswers, selectMyProject, selectProject } from '../services/selectors';
import { assembleOnePager } from '../services/onePager';
import { OnePagerDocument } from '../components/OnePagerDocument';
import { AccessDenied } from '../components/guards';

/**
 * One-pager. Для пира — свой проект; для куратора — по projectId из URL.
 * В обоих случаях данные читаются через селекторы, т.е. через canAccess.
 */
export function OnePagerScreen({ scope }: { scope: 'peer' | 'curator' }) {
  const { projectId } = useParams();
  const { state } = useApp();
  const project = scope === 'peer' ? selectMyProject(state) : selectProject(state, projectId);
  const onePager = useMemo(
    () => (project ? assembleOnePager(project, state.templates, selectAnswers(state, project.id)) : null),
    [project, state],
  );

  if (scope === 'peer' && !project) return <Navigate to="/peer/new" replace />;
  if (!project || !onePager) return <AccessDenied reason="Проект не найден или недоступен для вашей роли." />;

  const backTo = scope === 'peer' ? '/peer' : `/curator/project/${project.id}`;

  return (
    <main className="page">
      <div className="page-head no-print">
        <div>
          <div className="eyebrow">One-pager · собран автоматически</div>
          <h1>{project.name}</h1>
          <p>
            Готово {onePager.readyCount} из {onePager.totalCount} разделов. Документ обновляется мгновенно после каждого сохранения ответа
            в модуле — здесь ничего не нужно переписывать вручную.
          </p>
        </div>
        <div className="page-head__actions">
          <Link to={backTo} className="btn">
            <ArrowLeft size={16} /> {scope === 'peer' ? 'К модулям' : 'К проекту'}
          </Link>
          <button className="btn" onClick={() => window.print()}>
            <Printer size={16} /> Печать / PDF
          </button>
          <Link to={`/present/${project.id}`} className="btn btn--primary">
            <Presentation size={16} /> Презентация
          </Link>
        </div>
      </div>
      <div className="paper-wrap">
        <OnePagerDocument onePager={onePager} />
      </div>
    </main>
  );
}
