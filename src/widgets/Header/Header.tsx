import { Menu, Bot } from 'lucide-react';
import { usePermission } from '@shared/hooks/usePermission';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle: () => void;
  onChatbotToggle: () => void;
  title: string;
  chatbotOpen: boolean;
}

export function Header({ onMenuToggle, onChatbotToggle, title, chatbotOpen }: HeaderProps) {
  const canUseChatbot = usePermission('common.use_chatbot');

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuToggle}
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>
      <h1 className={styles.title}>{title}</h1>
      {canUseChatbot && (
        <button
          type="button"
          className={`${styles.chatbotBtn} ${chatbotOpen ? styles.active : ''}`}
          onClick={onChatbotToggle}
          aria-label={chatbotOpen ? "Đóng Trợ lý AI" : "Mở Trợ lý AI"}
        >
          <Bot size={20} />
        </button>
      )}
    </header>
  );
}
