import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@widgets/Sidebar/Sidebar';
import { Header } from '@widgets/Header/Header';
import styles from './MainLayout.module.css';

const TITLES: Record<string, string> = {
  '/dashboard': 'Tổng Quan',
  '/bom': 'Quản Lý BOM',
  '/inventory': 'Quản Lý Kho',
};

export function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = TITLES[location.pathname] ?? 'Xuân Hòa ERP';

  return (
    <div className={styles.layout}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Header title={pageTitle} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
