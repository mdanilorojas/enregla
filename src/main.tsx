import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { queryClient } from './lib/queryClient';
import { assertDemoModeNotInProduction } from './lib/demo';
import './index.css';

assertDemoModeNotInProduction();

// StrictMode deshabilitado: causaba doble-mount que rompía supabase-js auth
// con noopLock. Volvemos a Web Locks API default (sin override) ya que el
// doble-mount era el único motivo del workaround.
createRoot(document.getElementById('root')!).render(
  <>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </>,
);
