import { Bot } from 'lucide-react';
import type { ChatMessage } from '@entities/assistant/model/types';
import { ChatMarkdown } from './ChatMarkdown';
import styles from './ChatMessageBubble.module.css';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.bubbleWrapper} ${isUser ? styles.userWrapper : styles.assistantWrapper}`}>
      {!isUser && (
        <div className={styles.avatar}>
          <Bot size={16} />
        </div>
      )}
      <div className={styles.messageContent}>
        {isUser ? (
          <div className={styles.text}>{message.content}</div>
        ) : (
          <div className={styles.markdown}>
            {message.content ? (
              <ChatMarkdown content={message.content} />
            ) : (
              <div className={styles.typingIndicator} aria-label="Trợ lý đang suy nghĩ">
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
