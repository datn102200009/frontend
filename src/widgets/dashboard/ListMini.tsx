import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';
import {
  buildItemLink,
  buildItemTitle,
  buildItemSubtext,
  buildItemMeta,
} from './kpiListRowHelpers';

export interface ListMiniProps {
  title: string;
  code: string;
  icon?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  quickLinks?: string[];
  totalCount?: number;
}

export function ListMini({ title, code, icon, data, quickLinks }: ListMiniProps) {
  const items = Array.isArray(data) ? data : [];
  const [activeTab, setActiveTab] = useState<'all' | 'receipt' | 'issue' | 'transfer'>('all');

  const filteredItems = items.filter((item) => {
    if (code !== 'inventory_pending_entries') return true;
    if (activeTab === 'all') return true;
    return item.purpose === activeTab;
  });
  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody}>
        {code === 'inventory_pending_entries' && (
          <div className={styles.tabHeader}>
            <button
              onClick={() => setActiveTab('all')}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`${styles.tabBtn} ${activeTab === 'receipt' ? styles.tabBtnActive : ''}`}
            >
              Nhập 📥
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`${styles.tabBtn} ${activeTab === 'issue' ? styles.tabBtnActive : ''}`}
            >
              Xuất 📤
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`${styles.tabBtn} ${activeTab === 'transfer' ? styles.tabBtnActive : ''}`}
            >
              Chuyển 🔄
            </button>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox className={styles.emptyStateIcon} size={28} />
            <span>Không có hoạt động cần xử lý</span>
          </div>
        ) : (
          <div className={styles.listMiniTable}>
            {filteredItems.map((item, idx) => {
              const { to, display } = buildItemLink(item, code);
              return (
                <div key={(item.id as string) || String(idx)} className={styles.listMiniRow}>
                  <Link to={to} className={styles.colBoldLink}>
                    {display}
                  </Link>
                  <div className={styles.colTextEllipsis}>
                    {buildItemTitle(item, code)}
                    {buildItemSubtext(item, code)}
                  </div>
                  <div className={styles.colRightAlign}>{buildItemMeta(item, code)}</div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </div>
  );
}
