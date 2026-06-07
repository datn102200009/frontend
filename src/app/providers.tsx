import type { ReactNode } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import type { RootState } from './store';
import { ToastProvider } from '@shared/ui/Toast/Toast';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary/ErrorBoundary';
import { PermissionContext } from '@shared/lib/permissionContext';

function PermissionProvider({ children }: { children: ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  return (
    <PermissionContext.Provider value={user}>
      {children}
    </PermissionContext.Provider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PermissionProvider>
          <ToastProvider>{children}</ToastProvider>
        </PermissionProvider>
      </Provider>
    </ErrorBoundary>
  );
}
