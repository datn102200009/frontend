import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Calendar, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { DatePickerModal } from '@shared/ui/DatePickerModal/DatePickerModal';
import { useGetAccountsSystemLogsQuery, type SystemLogOutput } from '@features/accounts/api/accountsApi';
import '@shared/ui/Select/Select.scss';
import styles from './SystemLogsPage.module.css';

// Action tags that exist in the database system logs
const LOG_ACTIONS = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'create', label: 'Tạo mới' },
  { value: 'update', label: 'Cập nhật' },
  { value: 'delete', label: 'Xóa' },
  { value: 'approve', label: 'Phê duyệt' },
  { value: 'reject', label: 'Từ chối' },
  { value: 'cancel', label: 'Hủy' },
  { value: 'change_password', label: 'Đổi mật khẩu' },
  { value: 'approve_credit_bypass', label: 'Duyệt vượt hạn mức nợ' },
  { value: 'declare_production', label: 'Khai báo sản xuất' },
  { value: 'complete', label: 'Hoàn tất' },
  { value: 'run_depreciation', label: 'Trích khấu hao' },
  { value: 'reject_logistics', label: 'Từ chối vận chuyển' },
  { value: 'approve_logistics', label: 'Duyệt vận chuyển' },
  { value: 'reject_purchase', label: 'Từ chối mua TSCĐ' },
  { value: 'reject_dispose', label: 'Từ chối thanh lý TSCĐ' },
  { value: 'request_dispose', label: 'Yêu cầu thanh lý TSCĐ' },
  { value: 'request_dispose_zero_value', label: 'Yêu cầu thanh lý TSCĐ giá trị 0' },
  { value: 'auto_activate', label: 'Tự động kích hoạt TSCĐ' },
  { value: 'auto_dispose', label: 'Tự động thanh lý TSCĐ' },
  { value: 'terminated_by_discipline', label: 'Sa thải do kỷ luật' },
];

export const SystemLogsPage: React.FC = () => {
  // Filters state
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [action, setAction] = useState('');

  // Date picker modal states
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  // Pagination state (0-based pageIndex for DataTable)
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 15;

  // Query logs with current filters
  const { data: logsResponse, isLoading } = useGetAccountsSystemLogsQuery({
    search: search || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    action: action || undefined,
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  const logs = useMemo(() => logsResponse?.results || [], [logsResponse]);
  const totalCount = logsResponse?.count || 0;
  const pageCount = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPageIndex(0); // Reset to first page on search
  };

  // Define columns
  const columns = useMemo(() => {
    const helper = createColumnHelper<SystemLogOutput>();
    return [
      helper.accessor('timestamp', {
        header: 'Thời gian',
        cell: (info) => {
          const val = info.getValue();
          return (
            <div className={styles.timeCell}>
              <Calendar size={14} className={styles.mutedIcon} />
              <span>{new Date(val).toLocaleString('vi-VN')}</span>
            </div>
          );
        },
      }),
      helper.accessor('user', {
        header: 'Người thực hiện',
        cell: (info) => {
          const userObj = info.getValue();
          const userRepr = info.row.original.user_repr;
          if (!userObj && !userRepr) return <span className="text-slate-400 italic">Hệ thống</span>;
          return (
            <div className={styles.userCell}>
              <UserIcon size={14} className={styles.mutedIcon} />
              <span className="font-semibold text-slate-800">{userObj ? (userObj.full_name || userObj.username) : userRepr}</span>
            </div>
          );
        },
      }),
      helper.accessor('action_display', {
        header: 'Hành động',
        cell: (info) => {
          const actDisplay = info.getValue();
          const act = info.row.original.action;
          // Color badge based on modules
          let variant: 'info' | 'success' | 'warning' | 'error' | 'accent' | 'neutral' = 'neutral';
          if (act.startsWith('inventory.')) variant = 'success';
          else if (act.startsWith('manufacturing.')) variant = 'accent';
          else if (act.startsWith('sales.') || act.startsWith('purchasing.')) variant = 'info';
          else if (act.startsWith('finance.')) variant = 'warning';
          else if (act.startsWith('hrm.')) variant = 'neutral';
          else if (act.startsWith('accounts.')) variant = 'error';

          return <Badge variant={variant}>{actDisplay || act}</Badge>;
        },
      }),
      helper.accessor('message', {
        header: 'Chi tiết nội dung',
        cell: (info) => <span className={styles.messageText}>{info.getValue()}</span>,
      }),
    ];
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Nhật Kí Hoạt Động</h1>
          <p className={styles.subtitle}>Giám sát và kiểm toán toàn bộ hoạt động thay đổi dữ liệu trên hệ thống</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterSelect}>
          <SearchableSelect
            label="Hành động"
            value={action}
            onChange={(val) => {
              setAction(val);
              setPageIndex(0);
            }}
            options={LOG_ACTIONS}
            placeholder="Chọn hành động..."
          />
        </div>
        <div className={styles.filterInput}>
          <div className="select-container">
            <div className="select-label">Từ ngày</div>
            <div className="select-trigger" onClick={() => setStartOpen(true)}>
              <span className={clsx('select-value', { placeholder: !startDate })}>
                {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chọn ngày...'}
              </span>
              <Calendar size={18} className="select-icon" />
            </div>
            <DatePickerModal
              open={startOpen}
              onClose={() => setStartOpen(false)}
              value={startDate}
              onChange={(d) => {
                setStartDate(d);
                setPageIndex(0);
              }}
            />
          </div>
        </div>
        <div className={styles.filterInput}>
          <div className="select-container">
            <div className="select-label">Đến ngày</div>
            <div className="select-trigger" onClick={() => setEndOpen(true)}>
              <span className={clsx('select-value', { placeholder: !endDate })}>
                {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chọn ngày...'}
              </span>
              <Calendar size={18} className="select-icon" />
            </div>
            <DatePickerModal
              open={endOpen}
              onClose={() => setEndOpen(false)}
              value={endDate}
              onChange={(d) => {
                setEndDate(d);
                setPageIndex(0);
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <DataTable
          columns={columns}
          data={logs}
          loading={isLoading}
          searchPlaceholder="Tìm kiếm theo hành động, nội dung chi tiết..."
          initialSearch={search}
          onSearch={handleSearchChange}
          pageSize={pageSize}
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          totalCount={totalCount}
          emptyMessage="Không tìm thấy nhật ký"
          emptyDescription="Không có hoạt động nào khớp với bộ lọc hiện tại."
        />
      </div>
    </div>
  );
};
