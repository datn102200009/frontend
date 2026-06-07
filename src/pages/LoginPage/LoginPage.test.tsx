import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();
    
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
    
    expect(await screen.findByText('Vui lòng nhập tên đăng nhập')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const { store } = renderWithProviders(<LoginPage />);
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/^Tên đăng nhập/i), 'admin');
    await user.type(screen.getByLabelText(/^Mật khẩu/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
    
    await waitFor(() => {
      // Check if auth state was updated
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.token).toBe('mock-access-token');
      expect(store.getState().auth.user?.username).toBe('admin');
      expect(store.getState().auth.user?.full_name).toBe('Administrator');
      expect(store.getState().auth.user?.permissions).toContain('sales.approve_credit_bypass');
    });
    // Check if toast was called
    expect(screen.getByText(/đăng nhập thành công/i)).toBeInTheDocument();
  });

  it('handles login failure', async () => {
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/^Tên đăng nhập/i), 'wronguser');
    await user.type(screen.getByLabelText(/^Mật khẩu/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
    
    expect(await screen.findByRole('alert')).toHaveTextContent(/no active account found/i);
  });
});
