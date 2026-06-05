import React from 'react';
import { useGetPurchasingCertificationsQuery } from '@entities/purchasing/api/purchasingApi';
import type { TechnicalCertification } from '@entities/purchasing/api/purchasingApi';
import { Badge } from '@shared/ui/Badge/Badge';
import { Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react';
import styles from './QcReportPage.module.css';

export const QcReportPage: React.FC = () => {
  const { data, isLoading } = useGetPurchasingCertificationsQuery({});
  const certifications = (Array.isArray(data) ? data : (data as any)?.results || []) as TechnicalCertification[];

  if (isLoading) {
    return <div className={styles.loading}>Đang tải danh sách kiểm định chất lượng...</div>;
  }

  return (
    <div className={styles.container}>
      {certifications.length === 0 ? (
        <div className={styles.empty}>
          <FileText size={48} className={styles.emptyIcon} />
          <h3>Chưa có biên bản kiểm định nào</h3>
          <p>Mọi hoạt động QA/QC trên lô hàng sẽ được ghi nhận và lưu trữ lịch sử tại đây.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Chứng Chỉ</th>
                <th>Sản Phẩm</th>
                <th>Phiếu Nhập Kho</th>
                <th>Kiểu Kiểm Định</th>
                <th>Kết Quả</th>
                <th>Ngày Cấp</th>
                <th>Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id}>
                  <td className={styles.certId}>{cert.cert_id}</td>
                  <td>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemCode}>{cert.item_code}</span>
                      <span className={styles.itemName}>{cert.item_name}</span>
                    </div>
                  </td>
                  <td className={styles.stockEntry}>{cert.stock_entry_name || 'N/A'}</td>
                  <td>{cert.cert_type}</td>
                  <td>
                    <Badge variant={cert.result === 'PASSED' ? 'success' : 'error'}>
                      <span className={styles.badgeContent}>
                        {cert.result === 'PASSED' ? (
                          <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                        ) : (
                          <XCircle size={12} style={{ marginRight: '4px' }} />
                        )}
                        {cert.result === 'PASSED' ? 'Đạt' : 'Không Đạt'}
                      </span>
                    </Badge>
                  </td>
                  <td>
                    <span className={styles.date}>
                      <Calendar size={12} style={{ marginRight: '4px' }} />
                      {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </td>
                  <td className={styles.remarks}>{cert.remarks || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
