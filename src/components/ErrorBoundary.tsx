import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearState } from '../state/persistence';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Последняя линия обороны: вместо белого экрана — понятное сообщение и кнопки восстановления. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <div className="card" style={{ maxWidth: 760 }}>
          <h2>Что-то пошло не так</h2>
          <p className="muted mt-1">Интерфейс перехватил ошибку и не дал приложению упасть. Данные в localStorage не тронуты.</p>
          <pre className="mt-2">{String(this.state.error?.stack ?? this.state.error)}</pre>
          <div className="row mt-2" style={{ justifyContent: 'center' }}>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Перезагрузить
            </button>
            <button
              className="btn btn--danger"
              onClick={() => {
                clearState();
                window.location.hash = '#/';
                window.location.reload();
              }}
            >
              Сбросить демо-данные и перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }
}
