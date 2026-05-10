import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] caught error:', error, info);
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      role="alert"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#374151',
        maxWidth: 560,
        margin: '64px auto',
        borderRadius: 12,
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        Algo salió mal
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
        Ocurrió un error inesperado. Intenta de nuevo o recarga la página.
      </p>
      {import.meta.env.DEV && (
        <pre
          style={{
            textAlign: 'left',
            background: '#F9FAFB',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            overflow: 'auto',
            marginBottom: 24,
            maxHeight: 200,
          }}
        >
          {error.message}
          {error.stack ? `\n\n${error.stack}` : ''}
        </pre>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: '#1E3A8A',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Reintentar
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: '#F3F4F6',
            color: '#374151',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Recargar página
        </button>
      </div>
    </div>
  );
}
