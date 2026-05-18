import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { renderWithProviders } from '../shared/lib/test/test-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setupTestRouter = (initialState: any) => {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      <Route element={<AuthGuard />}>
        <Route path="/guarded" element={<div data-testid="protected-content">Protected Content</div>} />
      </Route>
    </Routes>,
    {
      preloadedState: {
        auth: initialState,
      },
      initialEntries: ['/guarded'],
    }
  );
};

describe('AuthGuard', () => {
  it('redirects to /login when user is not authenticated', () => {
    setupTestRouter({
      isAuthenticated: false,
      user: null,
      token: null,
    });
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    setupTestRouter({
      isAuthenticated: true,
      user: { id: '1', username: 'admin', role: 'admin' },
      token: 'fake-token',
    });
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
