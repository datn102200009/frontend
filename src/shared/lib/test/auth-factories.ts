export interface MockUser {
  id?: string;
  username?: string;
  full_name?: string;
  role?: 'admin' | 'manager' | 'staff';
  permissions?: string[];
}

export interface MockAuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    full_name: string;
    role: 'admin' | 'manager' | 'staff';
    permissions: string[];
  } | null;
  token: string | null;
}

/**
 * Creates a mock authentication state for Redux preloadedState.
 */
export function createMockAuthState(
  userOverrides: MockUser = {},
  isAuthenticated = true,
  token = 'mock-token'
): { auth: MockAuthState } {
  return {
    auth: {
      isAuthenticated,
      token: isAuthenticated ? token : null,
      user: isAuthenticated
        ? {
            id: userOverrides.id || 'user-123',
            username: userOverrides.username || 'test_user',
            full_name: userOverrides.full_name || 'Test User',
            role: userOverrides.role || 'staff',
            permissions: userOverrides.permissions || [],
          }
        : null,
    },
  };
}

/**
 * Creates a mock admin authentication state.
 */
export function createAdminAuthState(permissions: string[] = ['*']): { auth: MockAuthState } {
  return createMockAuthState({
    id: 'admin-123',
    username: 'admin',
    full_name: 'Admin User',
    role: 'admin',
    permissions,
  });
}

/**
 * Creates a mock HRM staff/manager authentication state with custom permissions.
 */
export function createHrmAuthState(permissions: string[] = []): { auth: MockAuthState } {
  return createMockAuthState({
    id: 'hrm-123',
    username: 'hrm_user',
    full_name: 'HRM Staff',
    role: 'manager',
    permissions,
  });
}
