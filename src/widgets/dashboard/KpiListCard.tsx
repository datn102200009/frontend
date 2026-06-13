import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, RefreshCw as SpinnerIcon } from 'lucide-react';
import { CardHeader } from './CardHeader';
import { dashboardApi } from '../../entities/dashboard/api/dashboardApi';
import styles from './DashboardWidgets.module.css';
import {
  buildItemLink,
  buildItemTitle,
  buildItemSubtext,
  buildItemMeta,
} from './kpiListRowHelpers';

export interface KpiListCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: {
    total_count: number;
    top_items: Array<Record<string, any>>;
    [key: string]: any;
  };
}

function getKpiListConfig(code: string): { heroColor?: string } {
  switch (code) {
    case 'sales_pending_credit_bypass':
    case 'purchasing_pending_qc':
    case 'purchasing_pending_logistic_fees':
    case 'hrm_expiring_contracts':
    case 'manufacturing_pending_wo_approval':
      return { heroColor: 'var(--clr-warning-600)' };
    case 'purchasing_blocked_invoices':
      return { heroColor: 'var(--clr-error-600)' };
    default:
      return {};
  }
}

export function KpiListCard({ title, code, icon, data, quickLinks }: KpiListCardProps) {
  const isPendingEntries = code === 'inventory_pending_entries';
  const [activeTab, setActiveTab] = useState<'all' | 'receipt' | 'issue' | 'transfer'>('all');

  const [triggerFetch, { data: fetchResult, isFetching }] =
    dashboardApi.useLazyGetDashboardWidgetsByWidgetCodeQuery();

  useEffect(() => {
    if (isPendingEntries && activeTab !== 'all') {
      triggerFetch({
        widgetCode: 'inventory_pending_entries',
        purpose: activeTab,
      });
    }
  }, [activeTab, isPendingEntries, triggerFetch]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeData: any = data;
  if (isPendingEntries) {
    if (activeTab === 'all') {
      activeData = data;
    } else {
      activeData = fetchResult?.success ? fetchResult.data : null;
    }
  }

  const totalToShow = typeof activeData?.total_count === 'number' ? activeData.total_count : 0;
  const items = Array.isArray(activeData?.top_items) ? activeData.top_items : [];

  const config = getKpiListConfig(code);

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody} style={{ position: 'relative' }}>
        {isPendingEntries && (
          <div className={styles.kpiListTabFilter}>
            <button
              onClick={() => setActiveTab('all')}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              disabled={isFetching}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`${styles.tabBtn} ${activeTab === 'receipt' ? styles.tabBtnActive : ''}`}
              disabled={isFetching}
            >
              Nhập 📥
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`${styles.tabBtn} ${activeTab === 'issue' ? styles.tabBtnActive : ''}`}
              disabled={isFetching}
            >
              Xuất 📤
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`${styles.tabBtn} ${activeTab === 'transfer' ? styles.tabBtnActive : ''}`}
              disabled={isFetching}
            >
              Chuyển 🔄
            </button>
          </div>
        )}

        <div className={styles.kpiListHero}>
          <span
            className={styles.kpiHeroValue}
            style={config.heroColor ? { color: config.heroColor } : undefined}
          >
            {totalToShow}
          </span>
        </div>

        {isFetching && (
          <div className={styles.loadingOverlay} style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
            <SpinnerIcon className={styles.spinner} size={24} />
          </div>
        )}

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox className={styles.emptyStateIcon} size={24} />
            <span>Không có hoạt động cần xử lý</span>
          </div>
        ) : (
          <div className={styles.kpiListSection}>
            <div className={styles.listMiniTable}>
              {items.map((item: any, idx: number) => {
                const { to, display } = buildItemLink(item, code);
                return (
                  <div key={(item.id as string) || String(idx)} className={styles.kpiListRow}>
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
          </div>
        )}
      </div>
    </div>
  );
}
