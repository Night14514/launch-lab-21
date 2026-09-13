import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Info, Plus, Rocket, Trash2, UsersRound } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { selectMyProject } from '../../services/selectors';
import { useToast } from '../../components/Toast';
import type { Project, TeamMember } from '../../types';

const CATEGORIES = ['EdTech', 'DevTools', 'FinTech', 'HealthTech', 'Marketplace', 'AI · ML', 'SaaS · B2B', 'Social', 'GameDev', 'Другое'];

interface FormState {
  name: string;
  hook: string;
  category: string;
  description: string;
  team: TeamMember[];
}

export function ProjectWizardScreen({ mode }: { mode: 'create' | 'edit' }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const existing = selectMyProject(state);

  if (mode === 'create' && existing) return <Navigate to="/peer" replace />;
  if (mode === 'edit' && !existing) return <Navigate to="/peer/new" replace />;

  return <WizardForm key={existing?.id ?? 'new'} mode={mode} existing={existing} onDone={() => navigate('/peer')} />;
}

function WizardForm({ mode, existing, onDone }: { mode: 'create' | 'edit'; existing: Project | null; onDone: () => void }) {
  const { dispatch } = useApp();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    name: existing?.name ?? '',
    hook: existing?.hook ?? '',
    category: existing?.category ?? 'EdTech',
    description: existing?.description ?? '',
    team: existing?.team?.length ? existing.team : [{ name: '', role: '' }],
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nameError = touched && !form.name.trim() ? 'Название обязательно' : '';
  const canNext = step === 0 ? form.name.trim().length > 0 : true;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const updateMember = (i: number, patch: Partial<TeamMember>) =>
    setForm((f) => ({ ...f, team: f.team.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }));

  const submit = () => {
    if (submitting) return;
    setTouched(true);
    if (!form.name.trim()) {
      setStep(0);
      toast.error('Заполните название проекта');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        dispatch({ type: 'CREATE_PROJECT', input: form });
        toast.success('Проект создан', 'Теперь можно переходить к первому модулю');
      } else if (existing) {
        dispatch({ type: 'UPDATE_PROJECT', projectId: existing.id, patch: form });
        toast.success('Профиль обновлён');
      }
      onDone();
    } finally {
      window.setTimeout(() => setSubmitting(false), 500);
    }
  };

  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">{mode === 'create' ? 'Новый проект' : 'Профиль проекта'}</div>
          <h1>{mode === 'create' ? 'Расскажите о стартапе' : `Редактирование: ${existing?.name}`}</h1>
          <p>Эти данные станут шапкой вашего one-pager. Их можно изменить в любой момент.</p>
        </div>
      </div>

      <div className="wizard-steps" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className={`wizard-step ${i <= step ? 'wizard-step--done' : ''}`} />
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <>
            <div className="card__title">
              <Rocket size={18} /> Шаг 1 из 2 — о проекте
            </div>
            <div className="field">
              <label className="field__label" htmlFor="name">
                Название стартапа <span className="req">обязательно</span>
              </label>
              <input
                id="name"
                className={`input ${nameError ? 'input--invalid' : ''}`}
                placeholder="PeerPair"
                value={form.name}
                autoFocus
                onChange={(e) => update('name', e.target.value)}
                onBlur={() => setTouched(true)}
              />
              {nameError ? (
                <div className="field__error">{nameError}</div>
              ) : (
                <div className="field__hint">
                  <Info size={14} /> Короткое, запоминающееся. Так проект будет называться на дашборде куратора и в one-pager.
                </div>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="hook">
                Питч-хук <span className="opt">необязательно</span>
              </label>
              <input
                id="hook"
                className="input"
                placeholder="AI-компаньон, который за 30 секунд находит напарника на пару"
                value={form.hook}
                onChange={(e) => update('hook', e.target.value)}
              />
              <div className="field__hint">
                <Info size={14} /> Одна фраза, объясняющая суть проекта. Появится под названием в one-pager.
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="category">
                Категория
              </label>
              <select id="category" className="select" value={form.category} onChange={(e) => update('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {!CATEGORIES.includes(form.category) && <option value={form.category}>{form.category}</option>}
              </select>
              <div className="field__hint">
                <Info size={14} /> Помогает куратору группировать команды и подбирать менторов.
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="description">
                Краткое описание <span className="opt">необязательно</span>
              </label>
              <textarea
                id="description"
                className="textarea"
                placeholder="Telegram-бот и веб-панель для пиров School 21: подбирает напарника для peer-review по расписанию и уровню…"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
              <div className="field__hint">
                <Info size={14} /> 2–3 предложения: что это, для кого, как работает. Детали вы раскроете в модулях.
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="card__title">
              <UsersRound size={18} /> Шаг 2 из 2 — команда
            </div>
            <p className="muted small mb-2">Имя и роль каждого участника. Состав команды виден куратору и попадает в шапку one-pager.</p>
            {form.team.map((m, i) => (
              <div key={i} className="team-row">
                <input className="input" placeholder="Имя Фамилия" value={m.name} onChange={(e) => updateMember(i, { name: e.target.value })} />
                <input
                  className="input"
                  placeholder="Роль в команде (например, Backend)"
                  value={m.role}
                  onChange={(e) => updateMember(i, { role: e.target.value })}
                />
                <button
                  className="btn btn--ghost btn--icon"
                  title="Удалить участника"
                  disabled={form.team.length === 1}
                  onClick={() => update('team', form.team.filter((_, idx) => idx !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button className="btn btn--sm" onClick={() => update('team', [...form.team, { name: '', role: '' }])}>
              <Plus size={14} /> Добавить участника
            </button>
            <div className="field__hint mt-2">
              <Info size={14} /> Пустые строки будут проигнорированы при сохранении.
            </div>
          </>
        )}

        <div className="divider" />
        <div className="row row--between">
          {step > 0 ? (
            <button className="btn" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Назад
            </button>
          ) : mode === 'edit' ? (
            <button className="btn" onClick={onDone}>
              <ArrowLeft size={16} /> Отмена
            </button>
          ) : (
            <span />
          )}
          {step < 1 ? (
            <button
              className="btn btn--primary"
              disabled={!canNext}
              onClick={() => {
                setTouched(true);
                if (canNext) setStep(step + 1);
              }}
            >
              Дальше <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn--primary" disabled={submitting} onClick={submit}>
              <Rocket size={16} /> {mode === 'create' ? 'Создать проект' : 'Сохранить профиль'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
