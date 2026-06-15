import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, ChevronDown, Recycle, Eye } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { formatDateTime } from '@shared/lib/formatDate';
import { useCurrentUser } from '@shared/lib/permissionContext';
import {
  useGetFinanceFixedAssetsQuery,
  useGetFinanceFixedAssetsDepreciationLogsQuery,
  type FixedAsset,
  type FixedAssetDepreciationLog,
} from '@entities/finance/api/financeApi';
import { AssetEditModal } from '@features/finance/fixed-assets/ui/AssetEditModal';
import { AssetPurchaseModal } from '@features/finance/fixed-assets/ui/AssetPurchaseModal';
import { AssetDisposeModal } from '@features/finance/fixed-assets/ui/AssetDisposeModal';
import { AssetViewModal } from '@features/finance/fixed-assets/ui/AssetViewModal';
import styles from './FixedAssetsWidget.module.css';
import clsx from 'clsx';
import { shortAssetCode } from '@shared/lib/shortId';

export function FixedAssetsWidget() {
  const [subTab, setSubTab] = useState<'list' | 'logs'>('list');
  const currentUser = useCurrentUser();
  const hasPermission = (perm: string) => currentUser?.permissions?.includes(perm) || false;

  // Status Filter State
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fixed Asset queries
  const { data: assetsData, isLoading: isLoadingAssets, refetch: refetchAssets } = useGetFinanceFixedAssetsQuery({
    statusIn: statusFilter || undefined,
    limit: 200,
  });
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
  const [showPurchase, setShowPurchase] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [disposingAsset, setDisposingAsset] = useState<FixedAsset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<FixedAsset | null>(null);

  // Handle updates success
  const handlePurchaseSuccess = () => {
    setShowPurchase(false);
    refetchAssets();
  };

  const handleEditSuccess = () => {
    setEditingAsset(null);
    refetchAssets();
  };

  const handleDisposeSuccess = () => {
    setDisposingAsset(null);
    refetchAssets();
    refetchLogs();
  };

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear - 4; y <= currentYear + 4; y++) {
      list.push(y.toString());
    }
    return list;
  }, [currentYear]);

  // Columns for Fixed Asset Table
  const assetColumns = useMemo<ColumnDef<FixedAsset, unknown>[]>(
    () => [
      {
        accessorKey: 'asset_code',
        header: 'Mã Tài Sản',
        size: 100,
        cell: ({ row }) => shortAssetCode(row.original.asset_code),
      },
      { accessorKey: 'asset_name', header: 'Tên Tài Sản' },
      {
        accessorKey: 'depreciation_method',
        header: 'Phương pháp khấu hao',
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
        accessorKey: 'accumulated_depreciation',
        header: 'Lũy kế khấu hao',
        cell: ({ row }) => Number(row.original.accumulated_depreciation ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        header: 'Thời gian / Sản lượng KH',
        cell: ({ row }) => {
          const asset = row.original;
          if (asset.depreciation_method === 'straight_line') {
            return `${asset.remaining_life_months}/${asset.useful_life_months} tháng`;
          } else {
            const originalVal = Number(asset.original_value || 0);
            const salvageVal = Number(asset.salvage_value || 0);
            const depreciableValue = originalVal - salvageVal;
            const designCap = Number(asset.designed_capacity || 0);
            const accumulatedDep = Number(asset.accumulated_depreciation || 0);

            let prodDepQty = 0;
            if (depreciableValue > 0 && designCap > 0) {
              prodDepQty = accumulatedDep / (depreciableValue / designCap);
            }
            return `${prodDepQty.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/${designCap.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} sp`;
          }
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'pending_receive') return <Badge variant="warning">Chờ duyệt mua</Badge>;
          if (status === 'idle') return <Badge variant="info">Đang nhàn rỗi</Badge>;
          if (status === 'active') return <Badge variant="success">Đang hoạt động</Badge>;
          if (status === 'pending_dispose') return <Badge variant="warning">Chờ duyệt thanh lý</Badge>;
          if (status === 'disposed') return <Badge variant="error">Đã thanh lý</Badge>;
          return <Badge variant="info">{status}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        size: 120,
        cell: ({ row }) => {
          const asset = row.original;
          const status = asset.status;
          return (
            <TableActions>
              <ActionButton
                icon={<Eye size={16} />}
                title="Xem chi tiết"
                onClick={() => setViewingAsset(asset)}
              />
              {status === 'idle' && (
                <ActionButton
                  icon={<Pencil size={16} />}
                  title="Chỉnh sửa"
                  onClick={() => setEditingAsset(asset)}
                />
              )}
              {status === 'idle' && hasPermission('finance.update_fixed_asset') && (
                <ActionButton
                  icon={<Recycle size={16} />}
                  title="Yêu cầu thanh lý"
                  variant="danger"
                  onClick={() => setDisposingAsset(asset)}
                />
              )}
            </TableActions>
          );
        },
      },
    ],
    [currentUser],
  );

  // Columns for Depreciation Logs Table
  const logColumns = useMemo<ColumnDef<FixedAssetDepreciationLog, unknown>[]>(
    () => [
      {
        accessorKey: 'asset_code',
        header: 'Mã Tài Sản',
        size: 100,
        cell: ({ row }) => shortAssetCode(row.original.asset_code),
      },
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
              <h3 className={styles.title}>Quản Lí Tài Sản Cố Định</h3>
            </div>
            <div className={styles.actions} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap' }}>Trạng thái:</span>
                <div className="filterSelectWrapper">
                  <select
                    className="filterSelectInput"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ minWidth: '160px', paddingRight: '24px' }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending_receive">Chờ duyệt mua</option>
                    <option value="pending_dispose">Chờ duyệt thanh lý</option>
                    <option value="idle">Đang nhàn rỗi</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="disposed">Đã thanh lý</option>
                  </select>
                  <ChevronDown size={14} className="filterSelectIcon" style={{ right: '8px' }} />
                </div>
              </div>
              <Button
                icon={<Plus size={16} />}
                onClick={() => setShowPurchase(true)}
              >
                Mua TSCĐ
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

      {/* Purchase Modal */}
      {showPurchase && (
        <AssetPurchaseModal
          open={showPurchase}
          onClose={() => setShowPurchase(false)}
          onSave={handlePurchaseSuccess}
        />
      )}

      {/* Edit Modal */}
      {editingAsset && (
        <AssetEditModal
          open={!!editingAsset}
          editingAsset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={handleEditSuccess}
        />
      )}

      {/* Dispose Confirmation Modal */}
      {disposingAsset && (
        <AssetDisposeModal
          open={!!disposingAsset}
          asset={disposingAsset}
          onClose={() => setDisposingAsset(null)}
          onConfirm={handleDisposeSuccess}
        />
      )}

      {/* View Modal */}
      {viewingAsset && (
        <AssetViewModal
          open={!!viewingAsset}
          asset={viewingAsset}
          onClose={() => setViewingAsset(null)}
        />
      )}


    </div>
  );
}
