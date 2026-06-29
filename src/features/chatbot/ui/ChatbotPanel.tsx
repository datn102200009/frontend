import { useSelector, useDispatch } from 'react-redux';
import { Trash2, X } from 'lucide-react';
import { usePermission } from '@shared/hooks/usePermission';
import { ChatMessageList } from './ChatMessageList';
import { ChatInputForm } from './ChatInputForm';
import { clear } from '../model/chatbotUiSlice';
import type { ChatMessage } from '@entities/assistant/model/types';
import styles from './ChatbotPanel.module.css';

interface ChatbotPanelProps {
  open: boolean;
  onClose?: () => void;
}

export function ChatbotPanel({ open, onClose }: ChatbotPanelProps) {
  const canUse = usePermission('common.use_chatbot');
  const dispatch = useDispatch();
  const messages = useSelector((s: any) => s.chatbotUi.messages) as ChatMessage[];
  const isStreaming = useSelector((s: any) => s.chatbotUi.isStreaming) as boolean;
  const error = useSelector((s: any) => s.chatbotUi.error) as string | null;

  if (!canUse) return null;

  const getFriendlyErrorMessage = (err: string | null): string | null => {
    if (!err) return null;
    const lower = err.toLowerCase();
    if (lower.includes('invalid_argument') || lower.includes('api key not valid')) {
      return 'Cấu hình kết nối AI không hợp lệ. Vui lòng liên hệ quản trị viên.';
    }
    if (lower.includes('permission_denied') || lower.includes('không có quyền')) {
      return 'Bạn không có quyền sử dụng chức năng hoặc thao tác này.';
    }
    if (lower.includes('throttled') || lower.includes('too many requests') || lower.includes('429')) {
      return 'Yêu cầu quá giới hạn tần suất. Vui lòng thử lại sau ít phút.';
    }
    if (lower.includes('internal_error') || lower.includes('lỗi hệ thống') || lower.includes('500')) {
      return 'Trợ lý AI đang gặp sự cố kết nối. Vui lòng thử lại sau.';
    }
    return 'Đã xảy ra lỗi khi trao đổi với Trợ lý AI. Vui lòng thử lại.';
  };

  return (
    <aside className={`${styles.panel} ${open ? '' : styles.collapsed}`}>
      <header className={styles.header}>
        <h3>Trợ lý AI</h3>
        <div className={styles.headerActions}>
          {onClose && (
            <button
              onClick={onClose}
              title="Đóng trợ lý AI"
              className={styles.closeBtn}
              type="button"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => dispatch(clear())}
            disabled={messages.length === 0 || isStreaming}
            title="Xoá hội thoại"
            className={styles.actionBtn}
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>
      <div className={styles.body}>
        {error && <div className={styles.errorBanner}>{getFriendlyErrorMessage(error)}</div>}
        <ChatMessageList messages={messages} isStreaming={isStreaming} />
      </div>
      <ChatInputForm disabled={isStreaming} />
    </aside>
  );
}
