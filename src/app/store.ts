import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '@features/auth/model/authSlice';
import chatbotUiReducer from '@features/chatbot/model/chatbotUiSlice';
import { baseApi } from '@shared/api/baseApi';
import './enhancedApi';

const appReducer = combineReducers({
  auth: authReducer,
  chatbotUi: chatbotUiReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState,
  });
};

export const store = setupStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = ReturnType<typeof setupStore>;
