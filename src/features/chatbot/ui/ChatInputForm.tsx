import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useSendAssistantChatMessageMutation } from '@entities/assistant/api/assistantApi';
import { consumeSSE } from '../lib/sseStream';
import {
  appendMessage,
  appendDelta,
  addToolCall,
  updateToolCall,
  setError,
  setStreaming,
} from '../model/chatbotUiSlice';
import type { ChatMessage } from '@entities/assistant/model/types';
import styles from './ChatInputForm.module.css';

const schema = z.object({
  content: z.string().min(1).max(4000),
});

interface ChatInputFormProps {
  disabled: boolean;
}

export function ChatInputForm({ disabled }: ChatInputFormProps) {
  const dispatch = useDispatch();
  const history = useSelector((s: any) => s.chatbotUi.messages) as ChatMessage[];
  const { register, handleSubmit, reset, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { content: '' },
  });
  const [sendMessage] = useSendAssistantChatMessageMutation();

  const onSubmit = async ({ content }: { content: string }) => {
    const userMsgId = crypto.randomUUID();
    const userMsg = { id: userMsgId, role: 'user' as const, content };
    dispatch(appendMessage(userMsg));
    dispatch(setStreaming(true));

    const historyForApi = history.map(({ role, content }) => ({ role, content }));
    try {
      const response = await sendMessage({
        content,
        conversation_history: historyForApi,
      }).unwrap();

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg = { id: assistantMsgId, role: 'assistant' as const, content: '', toolCalls: [] };
      dispatch(appendMessage(assistantMsg));

      for await (const event of consumeSSE(response)) {
        if (event.event === 'content_delta') {
          dispatch(appendDelta({ id: assistantMsgId, delta: event.data.delta }));
        } else if (event.event === 'tool_call_delta') {
          dispatch(addToolCall({ id: assistantMsgId, toolCall: event.data }));
        } else if (event.event === 'tool_result') {
          dispatch(
            updateToolCall({
              id: assistantMsgId,
              toolCallId: event.data.tool_call_id,
              result: event.data.result_preview,
            })
          );
        } else if (event.event === 'error') {
          dispatch(setError({ message: event.data.message || 'Lỗi chatbot' }));
        }
      }
    } catch (err: any) {
      dispatch(setError({ message: err.message || 'Lỗi kết nối máy chủ' }));
    } finally {
      dispatch(setStreaming(false));
      reset();
    }
  };

  const contentVal = watch('content');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <input
        type="text"
        {...register('content')}
        placeholder="Hỏi gì đó về ERP Xuân Hòa..."
        disabled={disabled}
        className={styles.input}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !contentVal?.trim()}
        className={styles.submitBtn}
      >
        Gửi
      </button>
    </form>
  );
}
