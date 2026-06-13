import { type ReactNode, useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Truck,
  ClipboardList,
  FileText,
  ShieldAlert,
  DollarSign,
  AlertTriangle,
  Package,
  RefreshCw,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BadgePercent,
  Users,
  CalendarRange,
  UserCheck,
  Hammer,
  Wrench,
  CheckCircle,
  RefreshCw as SpinnerIcon,
  AlertOctagon,
} from 'lucide-react';
import { dashboardApi, type WidgetMetadata } from '../../entities/dashboard/api/dashboardApi';
import { SkeletonShimmerCard } from './SkeletonShimmerCard';
import { ListMini } from './ListMini';
import { KpiCard } from './KpiCard';
import { KpiListCard } from './KpiListCard';
import { ComponentTrackerCard } from './ComponentTrackerCard';
import { ChartCard } from './ChartCard';
import { GaugeCard } from './GaugeCard';
import { DonutChartCard } from './DonutChartCard';
import { AgingBarChartCard } from './AgingBarChartCard';
import { StackedProgressCard } from './StackedProgressCard';
import { LineChartCard } from './LineChartCard';
import { CashflowOverviewCard } from './CashflowOverviewCard';
import styles from './DashboardWidgets.module.css';

export interface DashboardWidgetWrapperProps {
  widget: WidgetMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batchData: any;
  batchLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batchError: any;
}

function getWidgetIcon(code: string): ReactNode {
  switch (code) {
    case 'sales_today_revenue':
      return <TrendingUp size={16} />;
    case 'sales_draft_orders':
      return <Receipt size={16} />;
    case 'sales_pending_credit_bypass':
      return <CreditCard size={16} />;
    case 'sales_pending_fulfillment':
      return <Truck size={16} />;
    case 'purchasing_active_po_count':
      return <ClipboardList size={16} />;
    case 'purchasing_draft_orders':
      return <FileText size={16} />;
    case 'purchasing_pending_delivery':
      return <Truck size={16} />;
    case 'purchasing_pending_qc':
      return <ShieldAlert size={16} />;
    case 'purchasing_pending_logistic_fees':
      return <DollarSign size={16} />;
    case 'purchasing_blocked_invoices':
      return <AlertTriangle size={16} />;
    case 'inventory_pending_entry_count':
      return <Package size={16} />;
    case 'inventory_low_stock':
      return <AlertTriangle size={16} />;
    case 'inventory_pending_entries':
      return <RefreshCw size={16} />;
    case 'finance_cashflow_overview':
      return <CircleDollarSign size={16} />;
    case 'finance_unpaid_purchase_invoices':
      return <ArrowUpRight size={16} />;
    case 'finance_unpaid_sales_invoices':
      return <ArrowDownRight size={16} />;
    case 'finance_depreciation_status':
      return <BadgePercent size={16} />;
    case 'hrm_payroll_lifecycle_status':
      return <Users size={16} />;
    case 'hrm_pending_leave_requests':
      return <CalendarRange size={16} />;
    case 'hrm_expiring_contracts':
      return <FileText size={16} />;
    case 'hrm_today_attendance_rate':
      return <UserCheck size={16} />;
    case 'manufacturing_pending_wo_approval':
      return <Wrench size={16} />;
    case 'manufacturing_active_wos':
      return <Hammer size={16} />;
    case 'manufacturing_pending_declarations':
      return <Wrench size={16} />;
    case 'manufacturing_pending_completion':
      return <CheckCircle size={16} />;
    default:
      return <Package size={16} />;
  }
}

const SKELETON_TYPES = new Set([
  'kpi',
  'kpi_list',
  'donut_chart',
  'aging_bar',
  'gauge',
  'stacked_progress',
  'mini_chart',
  'list_mini',
  'line_chart',
  'cashflow_overview',
]);

export function DashboardWidgetWrapper({
  widget,
  batchData,
  batchLoading,
  batchError,
}: DashboardWidgetWrapperProps) {
  const {
    code = '',
    title = '',
    type = 'kpi',
    size = '1x1',
    quick_links = [],
  } = widget;

  const [triggerDetail, { data: detailData, error: detailError, isFetching: isFetchingDetail }] =
    dashboardApi.useLazyGetDashboardWidgetsByWidgetCodeQuery();

  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    if (batchLoading) {
      setHasRetried(false);
    }
  }, [batchLoading]);

  const batchResult = batchData?.[code];
  const activeSuccess = hasRetried && detailData ? detailData.success : batchResult?.success;
  const activeData = hasRetried && detailData ? detailData.data : batchResult?.data;
  const activeError = hasRetried
    ? detailData?.error || (detailError ? 'Lỗi kết nối chi tiết' : null)
    : batchResult?.error || (batchError ? 'Lỗi tải hệ thống' : null);
  const activeTotalCount =
    hasRetried && detailData ? detailData.total_count : batchResult?.total_count;

  const handleRetry = () => {
    setHasRetried(true);
    triggerDetail({ widgetCode: code });
  };

  const gridStyle: Record<string, string> = {};
  if (size === '1x2') {
    gridStyle.gridColumn = 'span 2';
    gridStyle.gridRow = 'span 2';
  } else if (size === '2x2') {
    gridStyle.gridColumn = 'span 2';
    gridStyle.gridRow = 'span 2';
  } else {
    gridStyle.gridColumn = 'span 1';
    gridStyle.gridRow = 'span 1';
  }

  if (batchLoading && !hasRetried) {
    const skelType = SKELETON_TYPES.has(type)
      ? (type as 'kpi' | 'kpi_list' | 'donut_chart' | 'aging_bar' | 'gauge' | 'stacked_progress' | 'mini_chart' | 'list_mini')
      : 'list_mini';
    return (
      <div style={gridStyle}>
        <SkeletonShimmerCard type={skelType} />
      </div>
    );
  }

  if (activeSuccess === false || activeError) {
    return (
      <div style={{ ...gridStyle, position: 'relative' }} className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{title}</span>
          <span className={styles.cardIcon}>{getWidgetIcon(code)}</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.errorContainer}>
            <AlertOctagon size={24} />
            <span className={styles.errorTitle}>Lỗi nạp dữ liệu</span>
            <span className={styles.errorText}>{activeError || 'Đã xảy ra lỗi không xác định.'}</span>
            <button onClick={handleRetry} disabled={isFetchingDetail} className={styles.retryBtn}>
              {isFetchingDetail ? (
                <SpinnerIcon className={styles.spinner} size={12} />
              ) : (
                <RefreshCw size={12} />
              )}
              <span>Thử lại</span>
            </button>
          </div>
        </div>
        {isFetchingDetail && (
          <div className={styles.loadingOverlay}>
            <SpinnerIcon className={styles.spinner} size={24} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...gridStyle, position: 'relative' }}>
      {type === 'kpi' && (
        <KpiCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'kpi_list' && (
        <KpiListCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'donut_chart' && (
        code === 'inventory_low_stock' ? (
          <ComponentTrackerCard
            title={title}
            code={code}
            icon={getWidgetIcon(code)}
            data={activeData}
            quickLinks={quick_links}
          />
        ) : code === 'finance_unpaid_purchase_invoices' || code === 'finance_unpaid_sales_invoices' ? (
          <AgingBarChartCard
            title={title}
            code={code}
            icon={getWidgetIcon(code)}
            data={activeData}
            quickLinks={quick_links}
          />
        ) : (
          <DonutChartCard
            title={title}
            code={code}
            icon={getWidgetIcon(code)}
            data={activeData}
            quickLinks={quick_links}
          />
        )
      )}

      {type === 'line_chart' && (
        <LineChartCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'cashflow_overview' && (
        <CashflowOverviewCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'aging_bar' && (
        <AgingBarChartCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'gauge' && (
        <GaugeCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'stacked_progress' && (
        <StackedProgressCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          totalCount={activeTotalCount}
          quickLinks={quick_links}
        />
      )}

      {type === 'mini_chart' && (
        <ChartCard
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
        />
      )}

      {type === 'list_mini' && (
        <ListMini
          title={title}
          code={code}
          icon={getWidgetIcon(code)}
          data={activeData}
          quickLinks={quick_links}
          totalCount={activeTotalCount}
        />
      )}

      {isFetchingDetail && (
        <div className={styles.loadingOverlay}>
          <SpinnerIcon className={styles.spinner} size={24} />
        </div>
      )}
    </div>
  );
}
