import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@widgets/Sidebar/Sidebar';
import { Header } from '@widgets/Header/Header';
import { ChatbotPanel } from '@features/chatbot/ui/ChatbotPanel';
import { usePermission } from '@shared/hooks/usePermission';
import styles from './MainLayout.module.css';

const TITLES: Record<string, string> = {
  '/dashboard': 'Tổng Quan',
  '/bom': 'Quản Lý BOM',
  '/inventory': 'Quản Lý Kho',
};

export function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(true);
  const location = useLocation();
  const pageTitle = TITLES[location.pathname] ?? 'Xuân Hòa ERP';
  const canUseChatbot = usePermission('common.use_chatbot');
  const showChatbotOffset = canUseChatbot && chatbotOpen;

  return (
    <div className={styles.layout}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`${styles.main} ${showChatbotOffset ? styles.mainWithChatbot : ''}`}>
        <Header
          title={pageTitle}
          chatbotOpen={chatbotOpen}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          onChatbotToggle={() => setChatbotOpen((v) => !v)}
        />
        <main className={styles.content}>{children}</main>
      </div>
      <ChatbotPanel open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}

