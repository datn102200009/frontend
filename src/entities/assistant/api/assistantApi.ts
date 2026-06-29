import { baseApi } from '@shared/api/baseApi';
import type { ChatRequest } from '../model/types';

export const assistantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendAssistantChatMessage: builder.mutation<Response, ChatRequest>({
      queryFn: async (arg) => {
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        try {
          const response = await fetch(`${baseUrl}/assistant/chat/messages/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(arg),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let parsedError = 'Lỗi gửi tin nhắn';
            try {
              const errJson = JSON.parse(errorText);
              parsedError = errJson.error || parsedError;
            } catch {
              parsedError = errorText || parsedError;
            }
            throw new Error(parsedError);
          }

          return { data: response };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message || 'Failed to send message',
            },
          };
        }
      },
    }),
  }),
});

export const { useSendAssistantChatMessageMutation } = assistantApi;
