import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@entities/assistant/model/types';

interface ChatbotUiState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
}

const initialState: ChatbotUiState = {
  messages: [],
  isStreaming: false,
  error: null,
};

export const chatbotUiSlice = createSlice({
  name: 'chatbotUi',
  initialState,
  reducers: {
    clear: (state) => {
      state.messages = [];
      state.isStreaming = false;
      state.error = null;
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    appendMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      state.error = null;
    },
    appendDelta: (state, action: PayloadAction<{ id: string; delta: string }>) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content += action.payload.delta;
      }
    },
    addToolCall: (
      state,
      action: PayloadAction<{ id: string; toolCall: { tool_call_id: string; tool_name: string; args_delta?: string } }>
    ) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        if (!msg.toolCalls) msg.toolCalls = [];
        const existing = msg.toolCalls.find((tc) => tc.id === action.payload.toolCall.tool_call_id);
        if (!existing) {
          msg.toolCalls.push({
            id: action.payload.toolCall.tool_call_id,
            type: 'function',
            function: {
              name: action.payload.toolCall.tool_name,
              arguments: action.payload.toolCall.args_delta || '',
            },
          });
        }
      }
    },
    updateToolCall: (state, action: PayloadAction<{ id: string; toolCallId: string; result: string }>) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg && msg.toolCalls) {
        const tc = msg.toolCalls.find((t) => t.id === action.payload.toolCallId);
        if (tc) {
          tc.result = action.payload.result;
        }
      }
    },
    setError: (state, action: PayloadAction<{ message: string } | null>) => {
      state.error = action.payload ? action.payload.message : null;
    },
  },
});

export const {
  clear,
  setStreaming,
  appendMessage,
  appendDelta,
  addToolCall,
  updateToolCall,
  setError,
} = chatbotUiSlice.actions;

export default chatbotUiSlice.reducer;
