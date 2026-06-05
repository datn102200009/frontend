import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Calendar, Plus, ChevronDown } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { FormSelect } from '@shared/ui/Select/FormSelect';
import { useToast } from '@shared/ui/Toast/Toast';
import { formatDateTime } from '@shared/lib/formatDate';
import {
  useGetFinanceFixedAssetsQuery,
  usePostFinanceFixedAssetsMutation,
  usePatchFinanceFixedAssetsByPkMutation,
  useDeleteFinanceFixedAssetsByPkMutation,
  usePostFinanceFixedAssetsDepreciationMutation,
  useGetFinanceFixedAssetsDepreciationLogsQuery,
  type FixedAsset,
  type FixedAssetDepreciationLog,
} from '@entities/finance/api/financeApi';
import styles from './FixedAssetsPage.module.css';
import clsx from 'clsx';

interface AssetFormData {
  asset_code: string;
  asset_name: string;
  original_value: number;
  salvage_value: number;
  depreciation_method: 'straight_line' | 'unit_of_production';
  useful_life_months: number;
  designed_capacity: number | '';
  department: string;
}

export function FixedAssetsPage() {
  const [subTab, setSubTab] = useState<'list' | 'logs'>('list');
  const { toast } = useToast();

  // Fixed Asset query and mutations
  const { data: assetsData, isLoading: isLoadingAssets, refetch: refetchAssets } = useGetFinanceFixedAssetsQuery({ limit: 1000 });
  const assets = assetsData?.results || [];

  const [createAsset, { isLoading: isCreatingAsset }] = usePostFinanceFixedAssetsMutation();
  const [updateAsset, { isLoading: isUpdatingAsset }] = usePatchFinanceFixedAssetsByPkMutation();
  const [deleteAsset, { isLoading: isDeletingAsset }] = useDeleteFinanceFixedAssetsByPkMutation();

  // Depreciation log query and mutations
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

  const [runDepreciation, { isLoading: isRunningDepreciation }] = usePostFinanceFixedAssetsDepreciationMutation();

  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<FixedAsset | null>(null);
  const [showRunDepreciation, setShowRunDepreciation] = useState(false);

  const today = useMemo(() => new Date(), []);
  const currentMonthStr = useMemo(() => String(today.getMonth() + 1).padStart(2, '0'), [today]);
  const currentYearStr = useMemo(() => String(today.getFullYear()), [today]);

  const [runMonth, setRunMonth] = useState(currentMonthStr);
  const [runYear, setRunYear] = useState(currentYearStr);
  const runPeriod = `${runYear}-${runMonth}`;

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear - 4; y <= currentYear + 4; y++) {
      list.push(y.toString());
    }
    return list;
  }, [currentYear]);

  useEffect(() => {
    if (showRunDepreciation) {
      const t = new Date();
      setRunMonth(String(t.getMonth() + 1).padStart(2, '0'));
      setRunYear(String(t.getFullYear()));
    }
  }, [showRunDepreciation]);

  // Form setup for create/update
  const { register, control, handleSubmit, formState: { errors }, watch, reset } = useForm<AssetFormData>({
    defaultValues: {
      asset_code: '',
      asset_name: '',
      original_value: 0,
      salvage_value: 0,
      depreciation_method: 'straight_line',
      useful_life_months: 12,
      designed_capacity: '',
      department: '',
    },
  });

  const watchDepreciationMethod = watch('depreciation_method');

  // Handle modal reset for edit / create
  useEffect(() => {
    if (editingAsset) {
      reset({
        asset_code: editingAsset.asset_code || '',
        asset_name: editingAsset.asset_name || '',
        original_value: editingAsset.original_value || 0,
        salvage_value: editingAsset.salvage_value || 0,
        depreciation_method: editingAsset.depreciation_method || 'straight_line',
        useful_life_months: editingAsset.useful_life_months || 0,
        designed_capacity: editingAsset.designed_capacity || '',
        department: editingAsset.department || '',
      });
    } else {
      reset({
        asset_code: '',
        asset_name: '',
        original_value: 0,
        salvage_value: 0,
        depreciation_method: 'straight_line',
        useful_life_months: 12,
        designed_capacity: '',
        department: '',
      });
    }
  }, [editingAsset, showCreate, reset]);

  // Submit asset CRUD
  const onSubmitAsset = async (data: AssetFormData) => {
    try {
      const payload = {
        asset_code: data.asset_code,
        asset_name: data.asset_name,
        original_value: Number(data.original_value),
        salvage_value: Number(data.salvage_value),
        depreciation_method: data.depreciation_method,
        useful_life_months: Number(data.useful_life_months),
        designed_capacity: data.depreciation_method === 'unit_of_production' ? Number(data.designed_capacity) : null,
        department: data.department || null,
      };

      if (editingAsset) {
        await updateAsset({
          pk: editingAsset.id!,
          fixedAssetUpdateInput: payload,
        }).unwrap();
        toast('success', 'Cập nhật tài sản cố định thành công');
        setEditingAsset(null);
      } else {
        await createAsset({
          fixedAssetInput: payload,
        }).unwrap();
        toast('success', 'Thêm mới tài sản cố định thành công');
        setShowCreate(false);
      }
      refetchAssets();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const confirmDeleteAsset = async () => {
    if (!deletingAsset) return;
    try {
      await deleteAsset({ pk: deletingAsset.id! }).unwrap();
      toast('success', `Xóa tài sản cố định ${deletingAsset.asset_code} thành công`);
      setDeletingAsset(null);
      refetchAssets();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Không thể xóa tài sản cố định');
    }
  };

  const handleRunDepreciation = async () => {
    if (!runPeriod) {
      toast('error', 'Vui lòng chọn kỳ trích khấu hao');
      return;
    }
    try {
      const result = await runDepreciation({
        runDepreciationInput: { period: runPeriod },
      }).unwrap();
      
      if (result.length > 0) {
        toast('success', `Đã trích khấu hao thành công cho ${result.length} tài sản trong kỳ ${runPeriod}`);
      } else {
        toast('info', `Không có tài sản nào phát sinh khấu hao trong kỳ ${runPeriod}`);
      }
      setShowRunDepreciation(false);
      refetchAssets();
      refetchLogs();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Lỗi khi chạy khấu hao');
    }
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
        cell: ({ row }) => (row.original.original_value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        accessorKey: 'salvage_value',
        header: 'Giá Trị Thanh Lý',
        cell: ({ row }) => (row.original.salvage_value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        accessorKey: 'accumulated_depreciation',
        header: 'Lũy Kế KH',
        cell: ({ row }) => (row.original.accumulated_depreciation ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      },
      {
        accessorKey: 'remaining_value',
        header: 'Giá Trị Còn Lại',
        cell: ({ row }) => {
          const orig = row.original.original_value || 0;
          const salv = row.original.salvage_value || 0;
          const accum = row.original.accumulated_depreciation || 0;
          const rem = Math.max(0, orig - salv - accum);
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
        cell: ({ row }) => (row.original.depreciation_amount ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
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

      {/* Create / Edit Asset Modal */}
      {(showCreate || editingAsset) && (
        <Modal
          open
          onClose={() => {
            setShowCreate(false);
            setEditingAsset(null);
          }}
          title={editingAsset ? 'Chỉnh Sửa Tài Sản Cố Định' : 'Thêm Tài Sản Cố Định Mới'}
          size="lg"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setEditingAsset(null);
                }}
                disabled={isCreatingAsset || isUpdatingAsset}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit(onSubmitAsset)}
                disabled={isCreatingAsset || isUpdatingAsset}
              >
                Lưu
              </Button>
            </>
          }
        >
          {editingAsset && (Number(editingAsset.accumulated_depreciation) || 0) > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--clr-error)',
                fontSize: 'var(--fs-xs)',
              }}
            >
              ⚠️ Tài sản đã phát sinh trích khấu hao. Một số thông tin cốt lõi (nguyên giá, phương pháp khấu hao, số tháng sử dụng hữu ích) sẽ bị khóa chỉnh sửa.
            </div>
          )}
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.row}>
              <Input
                label="Mã tài sản"
                required
                disabled={!!editingAsset}
                error={errors.asset_code?.message}
                {...register('asset_code', { required: 'Mã tài sản là bắt buộc' })}
              />
              <Input
                label="Tên tài sản"
                required
                error={errors.asset_name?.message}
                {...register('asset_name', { required: 'Tên tài sản là bắt buộc' })}
              />
            </div>

            <div className={styles.row}>
              <Input
                label="Nguyên giá (VND)"
                type="number"
                required
                disabled={editingAsset ? (Number(editingAsset.accumulated_depreciation) || 0) > 0 : false}
                error={errors.original_value?.message}
                {...register('original_value', {
                  required: 'Nguyên giá là bắt buộc',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Nguyên giá phải lớn hơn 0' },
                })}
              />
              <Input
                label="Giá trị thanh lý ước tính (VND)"
                type="number"
                disabled={editingAsset ? (Number(editingAsset.accumulated_depreciation) || 0) > 0 : false}
                error={errors.salvage_value?.message}
                {...register('salvage_value', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Không được là số âm' },
                })}
              />
            </div>

            <div className={styles.row}>
              <Controller
                control={control}
                name="depreciation_method"
                render={({ field }) => (
                  <FormSelect
                    label="Phương pháp khấu hao"
                    required
                    disabled={editingAsset ? (Number(editingAsset.accumulated_depreciation) || 0) > 0 : false}
                    options={[
                      { label: 'Đường thẳng', value: 'straight_line' },
                      { label: 'Sản lượng (UOP)', value: 'unit_of_production' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.depreciation_method?.message}
                  />
                )}
              />
              <Input
                label="Số tháng khấu hao hữu ích"
                type="number"
                required
                disabled={editingAsset ? (Number(editingAsset.accumulated_depreciation) || 0) > 0 : false}
                error={errors.useful_life_months?.message}
                {...register('useful_life_months', {
                  required: 'Số tháng khấu hao là bắt buộc',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Phải lớn hơn hoặc bằng 1' },
                })}
              />
            </div>

            <div className={styles.row}>
              {watchDepreciationMethod === 'unit_of_production' ? (
                <Input
                  label="Công suất thiết kế (Tổng sản lượng)"
                  type="number"
                  required
                  disabled={editingAsset ? (Number(editingAsset.accumulated_depreciation) || 0) > 0 : false}
                  error={errors.designed_capacity?.message}
                  {...register('designed_capacity', {
                    required: 'Công suất thiết kế bắt buộc cho phương pháp sản lượng',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'Công suất phải lớn hơn 0' },
                  })}
                />
              ) : (
                <div />
              )}
              <Input
                label="Phòng ban sử dụng"
                error={errors.department?.message}
                {...register('department')}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Asset Modal */}
      {deletingAsset && (
        <Modal
          open
          onClose={() => setDeletingAsset(null)}
          title="Xác Nhận Xóa Tài Sản"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeletingAsset(null)}>
                Hủy
              </Button>
              <Button variant="danger" onClick={confirmDeleteAsset} disabled={isDeletingAsset}>
                Xóa tài sản
              </Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn xóa tài sản cố định <strong>"{deletingAsset.asset_code} - {deletingAsset.asset_name}"</strong> không? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      )}

      {/* Run Depreciation Modal */}
      {showRunDepreciation && (
        <Modal
          open
          onClose={() => setShowRunDepreciation(false)}
          title="Trích Khấu Hao Tài Sản"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowRunDepreciation(false)}>
                Hủy
              </Button>
              <Button onClick={handleRunDepreciation} disabled={isRunningDepreciation}>
                {isRunningDepreciation ? 'Đang xử lý...' : 'Thực hiện'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Chọn kỳ (tháng) hạch toán khấu hao tự động. Hệ thống sẽ tự động quét các tài sản cố định hoạt động, tính sản lượng sản xuất thực tế liên kết với BOM để tính khấu hao UOP hoặc tính khấu hao đường thẳng tương ứng.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Kỳ trích khấu hao</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="run-month-select" style={{ fontSize: 'var(--fs-xxs, 10px)', color: 'var(--clr-text-muted)' }}>Tháng</label>
                  <div className="filterSelectWrapper" style={{ width: '100%' }}>
                    <select
                      id="run-month-select"
                      className="filterSelectInput"
                      value={runMonth}
                      onChange={(e) => setRunMonth(e.target.value)}
                      style={{ width: '100%', paddingRight: '28px' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = String(i + 1).padStart(2, '0');
                        return <option key={m} value={m}>{`Tháng ${m}`}</option>;
                      })}
                    </select>
                    <ChevronDown size={16} className="filterSelectIcon" style={{ right: '8px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="run-year-select" style={{ fontSize: 'var(--fs-xxs, 10px)', color: 'var(--clr-text-muted)' }}>Năm</label>
                  <div className="filterSelectWrapper" style={{ width: '100%' }}>
                    <select
                      id="run-year-select"
                      className="filterSelectInput"
                      value={runYear}
                      onChange={(e) => setRunYear(e.target.value)}
                      style={{ width: '100%', paddingRight: '28px' }}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="filterSelectIcon" style={{ right: '8px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
