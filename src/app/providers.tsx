import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary/ErrorBoundary';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ToastProvider>{children}</ToastProvider>
      </Provider>
    </ErrorBoundary>
  );
}
