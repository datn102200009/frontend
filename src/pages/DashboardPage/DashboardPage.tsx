import { useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  useGetDashboardWidgetsQuery,
  useGetDashboardWidgetsBatchDataQuery,
} from '../../entities/dashboard/api/dashboardApi';
import { DashboardWidgetWrapper } from '../../widgets/dashboard/DashboardWidgetWrapper';
import { Button } from '../../shared/ui/Button/Button';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  // 1. Fetch allowed widgets metadata list based on permissions
  const {
    data: widgetsMetadata = [],
    isLoading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata,
  } = useGetDashboardWidgetsQuery();

  // 2. Fetch data for all widgets in a single batch request, with 30s polling
  const {
    data: batchData,
    error: batchError,
    isLoading: batchLoading,
    refetch: refetchBatch,
  } = useGetDashboardWidgetsBatchDataQuery(
    {},
    {
      pollingInterval: 30000,
      skip: widgetsMetadata.length === 0,
    }
  );

  // 3. Focus Refresh: refetch batch data when browser tab gets focus
  useEffect(() => {
    const handleFocus = () => {
      if (widgetsMetadata.length > 0) {
        refetchBatch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchBatch, widgetsMetadata.length]);

  // Loading State (Initial metadata loading)
  if (metadataLoading) {
    return (
      <div className={styles.loadingContainer} role="status" aria-live="polite">
        <Loader2 className={styles.spinner} size={40} />
        <p>Đang tải thông tin trang tổng quan...</p>
      </div>
    );
  }

  // Error State (Failed to fetch metadata or not authenticated)
  if (metadataError) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} className="text-danger" />
        <h2 className={styles.errorTitle}>Lỗi nạp cấu hình Dashboard</h2>
        <p className={styles.errorSubtext}>
          Không thể lấy cấu trúc widgets của bạn. Vui lòng kiểm tra lại quyền truy cập hoặc thử lại.
        </p>
        <Button onClick={refetchMetadata} variant="outline">
          Tải lại cấu hình
        </Button>
      </div>
    );
  }

  // Empty State (No widgets allowed for this user role)
  if (widgetsMetadata.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <AlertCircle size={32} className="text-warning" />
        <h2>Không có dữ liệu hiển thị</h2>
        <p className={styles.errorSubtext}>
          Tài khoản của bạn chưa được phân quyền truy cập bất kỳ thẻ chỉ số nào trên trang tổng quan.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title} id="dashboard-title">Trang Tổng Quan</h1>
        <p className={styles.subtitle} id="dashboard-subtitle">

        </p>
      </div>

      <div className={styles.bentoGrid} role="region" aria-labelledby="dashboard-title">
        {widgetsMetadata.map((widget) => (
          <DashboardWidgetWrapper
            key={widget.code}
            widget={widget}
            batchData={batchData}
            batchLoading={batchLoading}
            batchError={batchError}
          />
        ))}
      </div>
    </div>
  );
}
