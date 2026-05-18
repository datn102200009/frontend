import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from './types';

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') ?? 'null'),
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: User; token: string; refresh?: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.token);
      if (action.payload.refresh) {
        localStorage.setItem('refresh_token', action.payload.refresh);
      }
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
