import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Calendar, Plus, ChevronDown } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { useToast } from '@shared/ui/Toast/Toast';
import { formatDateTime } from '@shared/lib/formatDate';
import {
  useGetFinanceFixedAssetsQuery,
  useGetFinanceFixedAssetsDepreciationLogsQuery,
  type FixedAsset,
  type FixedAssetDepreciationLog,
} from '@entities/finance/api/financeApi';
import { AssetFormModal } from '@features/finance/fixed-assets/ui/AssetFormModal';
import { DepreciationRunModal } from '@features/finance/fixed-assets/ui/DepreciationRunModal';
import { AssetDeleteModal } from '@features/finance/fixed-assets/ui/AssetDeleteModal';
import styles from './FixedAssetsWidget.module.css';
import clsx from 'clsx';

export function FixedAssetsWidget() {
  const [subTab, setSubTab] = useState<'list' | 'logs'>('list');
  const { toast } = useToast();

  // Fixed Asset queries
  const { data: assetsData, isLoading: isLoadingAssets, refetch: refetchAssets } = useGetFinanceFixedAssetsQuery({ limit: 1000 });
  const assets = assetsData?.results || [];

  // Depreciation log queries
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  const filterPeriod = useMemo(() => {
    if (filterMonth && filterYear) {
      return `${filterYear}-${filterMonth}`;
    }
    return '';
  }, [filterMonth, filterYear]);

  const { data: logsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useGetFinanceFixedAssetsDepreciationLogsQuery({
    period: filterPeriod || undefined,
    limit: 1000,
  });
  const logs = logsData?.results || [];

  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<FixedAsset | null>(null);
  const [showRunDepreciation, setShowRunDepreciation] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear - 4; y <= currentYear + 4; y++) {
      list.push(y.toString());
    }
    return list;
  }, [currentYear]);

  // Handle updates success
  const handleSaveSuccess = () => {
    setShowCreate(false);
    setEditingAsset(null);
    refetchAssets();
  };

  const handleDeleteSuccess = () => {
    setDeletingAsset(null);
    refetchAssets();
  };

  const handleRunDepreciationSuccess = (count: number, period: string) => {
    if (count > 0) {
      toast('success', `Đã trích khấu hao thành công cho ${count} tài sản trong kỳ ${period}`);
    } else {
      toast('info', `Không có tài sản nào phát sinh khấu hao trong kỳ ${period}`);
    }
    setShowRunDepreciation(false);
    refetchAssets();
    refetchLogs();
  };

  // Columns for Fixed Asset Table
  const assetColumns = useMemo<ColumnDef<FixedAsset, unknown>[]>(
    () => [
      { accessorKey: 'asset_code', header: 'Mã Tài Sản', size: 100 },
      { accessorKey: 'asset_name', header: 'Tên Tài Sản' },
      {
        accessorKey: 'depreciation_method',
        header: 'Phương Pháp KH',
        cell: ({ row }) => (
          row.original.depreciation_method === 'straight_line' ? (
            <Badge variant="info">Đường thẳng</Badge>
          ) : (
            <Badge variant="warning">Sản lượng</Badge>
          )
        ),
      },
      {
        accessorKey: 'original_value',
        header: 'Nguyên Giá',
        cell: ({ row }) => Number(row.original.original_value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        accessorKey: 'salvage_value',
        header: 'Giá Trị Thanh Lý',
        cell: ({ row }) => Number(row.original.salvage_value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        accessorKey: 'accumulated_depreciation',
        header: 'Lũy Kế KH',
        cell: ({ row }) => Number(row.original.accumulated_depreciation ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        accessorKey: 'remaining_value',
        header: 'Giá Trị Còn Lại',
        cell: ({ row }) => {
          const rem = Number(row.original.remaining_value ?? 0);
          return rem.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        },
      },
      {
        header: 'Thời Gian KH',
        cell: ({ row }) => `${row.original.remaining_life_months}/${row.original.useful_life_months} thg`,
      },
      { accessorKey: 'department', header: 'Bộ Phận', size: 100 },
      {
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        cell: ({ row }) => (
          <TableActions>
            <ActionButton
              icon={<Pencil size={16} />}
              title="Chỉnh sửa"
              onClick={() => setEditingAsset(row.original)}
            />
            <ActionButton
              icon={<Trash2 size={16} />}
              title="Xóa"
              variant="danger"
              onClick={() => setDeletingAsset(row.original)}
            />
          </TableActions>
        ),
      },
    ],
    [],
  );

  // Columns for Depreciation Logs Table
  const logColumns = useMemo<ColumnDef<FixedAssetDepreciationLog, unknown>[]>(
    () => [
      { accessorKey: 'asset_code', header: 'Mã Tài Sản', size: 100 },
      { accessorKey: 'asset_name', header: 'Tên Tài Sản' },
      { accessorKey: 'period', header: 'Kỳ Khấu Hao', size: 100 },
      {
        accessorKey: 'depreciation_amount',
        header: 'Số Tiền Khấu Hao',
        cell: ({ row }) => Number(row.original.depreciation_amount ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      { accessorKey: 'remarks', header: 'Ghi Chú/Chi Tiết' },
      {
        accessorKey: 'created_at',
        header: 'Ngày Thực Hiện',
        size: 160,
        cell: ({ row }) => formatDateTime(row.original.created_at || ''),
      },
    ],
    [],
  );

  return (
    <div className={styles.container}>
      {/* Sub Tabs */}
      <div className={styles.subTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'list'}
          className={clsx(styles.subTab, subTab === 'list' && styles.active)}
          onClick={() => setSubTab('list')}
        >
          Danh Sách Tài Sản
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'logs'}
          className={clsx(styles.subTab, subTab === 'logs' && styles.active)}
          onClick={() => setSubTab('logs')}
        >
          Lịch Sử Khấu Hao
        </button>
      </div>

      {subTab === 'list' ? (
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Tài Sản Cố Định</h3>
              <p className={styles.subtitle}>Danh sách khuôn mẫu và máy móc trích khấu hao</p>
            </div>
            <div className={styles.actions}>
              <Button
                variant="outline"
                icon={<Calendar size={16} />}
                onClick={() => setShowRunDepreciation(true)}
              >
                Trích Khấu Hao Tháng
              </Button>
              <Button
                icon={<Plus size={16} />}
                onClick={() => setShowCreate(true)}
              >
                Thêm Tài Sản
              </Button>
            </div>
          </div>
          <DataTable
            columns={assetColumns}
            data={assets}
            searchPlaceholder="Tìm theo mã hoặc tên tài sản..."
            loading={isLoadingAssets}
          />
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Lịch Sử Trích Khấu Hao</h3>
              <p className={styles.subtitle}>Nhật ký khấu hao tự động hàng tháng của tài sản</p>
            </div>
            <div className={styles.actions} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Tháng:</span>
                  <div className="filterSelectWrapper">
                    <select
                      className="filterSelectInput"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      style={{ minWidth: '90px', paddingRight: '24px' }}
                    >
                      <option value="">Tất cả</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = String(i + 1).padStart(2, '0');
                        return <option key={m} value={m}>{`Tháng ${m}`}</option>;
                      })}
                    </select>
                    <ChevronDown size={14} className="filterSelectIcon" style={{ right: '8px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Năm:</span>
                  <div className="filterSelectWrapper">
                    <select
                      className="filterSelectInput"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      style={{ minWidth: '95px', paddingRight: '24px' }}
                    >
                      <option value="">Tất cả</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="filterSelectIcon" style={{ right: '8px' }} />
                  </div>
                </div>
              </div>
              {(filterMonth || filterYear) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterMonth('');
                    setFilterYear('');
                  }}
                >
                  Xóa Lọc
                </Button>
              )}
            </div>
          </div>
          <DataTable
            columns={logColumns}
            data={logs}
            searchPlaceholder="Tìm theo mã hoặc tên tài sản..."
            loading={isLoadingLogs}
            emptyMessage="Không tìm thấy lịch sử khấu hao"
            emptyDescription="Chưa có nhật ký trích khấu hao nào cho kỳ được chọn."
          />
        </div>
      )}

      {/* Form Modal */}
      {(showCreate || editingAsset) && (
        <AssetFormModal
          open={showCreate || !!editingAsset}
          editingAsset={editingAsset}
          onClose={() => {
            setShowCreate(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <AssetDeleteModal
          open={!!deletingAsset}
          asset={deletingAsset}
          onClose={() => setDeletingAsset(null)}
          onConfirm={handleDeleteSuccess}
        />
      )}

      {/* Run Depreciation Modal */}
      {showRunDepreciation && (
        <DepreciationRunModal
          open={showRunDepreciation}
          onClose={() => setShowRunDepreciation(false)}
          onSuccess={handleRunDepreciationSuccess}
        />
      )}
    </div>
  );
}
