import type { LoginPayload, LoginResponse } from '../model/types';

/**
 * Mock login API — will be replaced with real httpClient.post('/auth/login/')
 */
export async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  await new Promise((r) => setTimeout(r, 800)); // Simulate network

  if (payload.username === 'admin' && payload.password === 'admin123') {
    return {
      user: {
        id: 'usr-001',
        username: 'admin',
        full_name: 'Nguyễn Xuân Hòa',
        role: 'admin',
      },
      access: 'mock-jwt-access-token-xyz',
      refresh: 'mock-jwt-refresh-token-xyz',
    };
  }

  if (payload.username === 'staff' && payload.password === 'staff123') {
    return {
      user: {
        id: 'usr-002',
        username: 'staff',
        full_name: 'Trần Thị Kho',
        role: 'staff',
      },
      access: 'mock-jwt-access-token-staff',
      refresh: 'mock-jwt-refresh-token-staff',
    };
  }

  throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
}
