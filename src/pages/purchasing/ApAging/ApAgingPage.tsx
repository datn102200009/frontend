import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { useGetPurchasingReportsApAgingQuery } from '@entities/purchasing/api/purchasingApi';
import type { ApAging } from '@entities/purchasing/api/purchasingApi';
import { BarChart3, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import styles from './ApAgingPage.module.css';

export const ApAgingPage: React.FC = () => {
  const { data: agingData = [], isLoading } = useGetPurchasingReportsApAgingQuery({});

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Calculate totals for summary cards
  const summary = useMemo(() => {
    let totalUnpaid = 0;
    let totalNotDue = 0;
    let totalOverdue1_30 = 0;
    let totalOverdueAbove30 = 0;

    agingData.forEach((item) => {
      totalUnpaid += item.total_unpaid || 0;
      totalNotDue += item.not_due || 0;
      totalOverdue1_30 += item.overdue_1_30 || 0;
      totalOverdueAbove30 += item.overdue_above_30 || 0;
    });

    return {
      totalUnpaid,
      totalNotDue,
      totalOverdue1_30,
      totalOverdueAbove30,
      overduePercentage: totalUnpaid > 0 ? ((totalOverdue1_30 + totalOverdueAbove30) / totalUnpaid) * 100 : 0
    };
  }, [agingData]);

  const columns = useMemo(() => {
    const helper = createColumnHelper<ApAging>();
    return [
      helper.accessor('vendor_code', {
        header: 'Mã NCC',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('vendor_name', {
        header: 'Tên Nhà Cung Cấp',
        cell: (info) => info.getValue() || 'Unknown',
      }),
      helper.accessor('not_due', {
        header: 'Chưa Đến Hạn',
        cell: (info) => <span className="text-slate-600 font-medium">{formatCurrency(info.getValue())}</span>,
      }),
      helper.accessor('overdue_1_30', {
        header: 'Quá Hạn 1 - 30 Ngày',
        cell: (info) => {
          const val = info.getValue() || 0;
          return (
            <span className={val > 0 ? "text-amber-600 font-semibold" : "text-slate-400"}>
              {formatCurrency(val)}
            </span>
          );
        },
      }),
      helper.accessor('overdue_above_30', {
        header: 'Quá Hạn > 30 Ngày',
        cell: (info) => {
          const val = info.getValue() || 0;
          return (
            <span className={val > 0 ? "text-red-600 font-bold" : "text-slate-400"}>
              {formatCurrency(val)}
            </span>
          );
        },
      }),
      helper.accessor('total_unpaid', {
        header: 'Tổng Dư Nợ AP',
        cell: (info) => <span className="text-slate-900 font-bold">{formatCurrency(info.getValue())}</span>,
      }),
    ];
  }, []);

  return (
    <div className={styles.container}>
      {/* Summary KPI Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.kpiCard} ${styles.totalCard}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Tổng Phải Trả NCC</span>
            <TrendingUp size={16} className={styles.iconTotal} />
          </div>
          <div className={styles.kpiValue}>{formatCurrency(summary.totalUnpaid)}</div>
          <div className={styles.kpiDesc}>Tổng số dư công nợ phải trả hiện tại</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.successCard}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Công nợ Chưa đến hạn</span>
            <CheckCircle2 size={16} className={styles.iconSuccess} />
          </div>
          <div className={styles.kpiValue}>{formatCurrency(summary.totalNotDue)}</div>
          <div className={styles.kpiDesc}>Các khoản nợ đang trong hạn thanh toán</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.warningCard}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Quá Hạn 1 - 30 Ngày</span>
            <AlertTriangle size={16} className={styles.iconWarning} />
          </div>
          <div className={styles.kpiValue}>{formatCurrency(summary.totalOverdue1_30)}</div>
          <div className={styles.kpiDesc}>Công nợ chậm trả dưới 30 ngày</div>
        </div>

        <div className={`${styles.kpiCard} ${styles.errorCard}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Quá Hạn {'>'} 30 Ngày</span>
            <AlertTriangle size={16} className={styles.iconError} />
          </div>
          <div className={styles.kpiValue}>{formatCurrency(summary.totalOverdueAbove30)}</div>
          <div className={styles.kpiDesc}>Công nợ chậm trả nghiêm trọng cần ưu tiên</div>
        </div>
      </div>

      {/* Main Report Table */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrap}>
            <BarChart3 size={18} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Bảng chi tiết Tuổi nợ (AP Aging Report)</h3>
          </div>
          <div className={styles.badgeWrap}>
            Tỷ lệ nợ quá hạn: <span className={summary.overduePercentage > 0 ? styles.percentActive : styles.percentZero}>{summary.overduePercentage.toFixed(1)}%</span>
          </div>
        </div>

        <div className={styles.tableCard}>
          <DataTable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            data={agingData}
            loading={isLoading}
            searchPlaceholder="Tìm kiếm nhà cung cấp..."
            emptyMessage="Không phát sinh công nợ phải trả nào."
          />
        </div>
      </div>
    </div>
  );
};
