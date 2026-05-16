import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from '../shared/ui/Toast/Toast';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  );
}
