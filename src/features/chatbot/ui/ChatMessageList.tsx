import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@entities/assistant/model/types';
import { ChatMessageBubble } from './ChatMessageBubble';
import styles from './ChatMessageList.module.css';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatMessageList({ messages, isStreaming }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className={styles.list}>
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.welcomeText}>Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</div>
        </div>
      ) : (
        messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
      )}
      <div ref={bottomRef} />
    </div>
  );
}
