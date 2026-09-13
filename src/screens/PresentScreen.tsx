import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Maximize2, Minimize2, Printer, X } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { selectAnswers, selectProject } from '../services/selectors';
import { assembleOnePager } from '../services/onePager';
import { OnePagerDocument } from '../components/OnePagerDocument';
import { AccessDenied } from '../components/guards';

/** Полноэкранный презентационный режим one-pager для показа жюри. Доступ — через canAccess('onepager:read'). */
export function PresentScreen() {
  const { projectId } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();
  const project = selectProject(state, projectId);
  const onePager = useMemo(
    () => (project ? assembleOnePager(project, state.templates, selectAnswers(state, project.id)) : null),
    [project, state],
  );

  const back = () => navigate(state.actor?.role === 'curator' ? `/curator/project/${projectId}` : '/peer/onepager');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, state.actor?.role]);

  if (!state.actor) return <Navigate to="/" replace />;
  if (!project || !onePager) {
    return <AccessDenied reason="Презентационный режим доступен только для проекта, который вы имеете право видеть." />;
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* браузер может запретить — не критично */
    }
  };

  return (
    <div className="present" data-theme="dark">
      <div className="present__bar no-print">
        <button className="btn btn--sm" onClick={() => window.print()}>
          <Printer size={14} /> PDF
        </button>
        <button className="btn btn--sm" onClick={toggleFullscreen}>
          {document.fullscreenElement ? <Minimize2 size={14} /> : <Maximize2 size={14} />} Во весь экран
        </button>
        <button className="btn btn--sm" onClick={back} title="Esc">
          <X size={14} /> Выйти
        </button>
      </div>
      <div className="paper-wrap">
        <OnePagerDocument onePager={onePager} />
      </div>
    </div>
  );
}
