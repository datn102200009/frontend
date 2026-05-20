import { useState, useEffect } from 'react';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { formatDateTime } from '@shared/lib/formatDate';
import { useToast } from '@shared/ui/Toast/Toast';
import { useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';
import { 
  usePostInventoryStockEntryByStockEntryIdUpdateMutation,
  usePostInventoryStockInByStockEntryIdApproveMutation,
  usePostInventoryStockIssueByStockEntryIdApproveMutation,
  usePostInventoryStockTransferByStockEntryIdApproveMutation,
  useGetInventoryStockLedgerBalanceQuery
} from '@features/inventory/api/inventoryApi';
import type { StockEntry } from '@features/inventory/api/inventoryApi';

const PURPOSE_LABELS: Record<string, string> = {
  receipt: 'Nhập kho',
  issue: 'Xuất kho SX',
  transfer: 'Chuyển kho',
  manufacture: 'Sản xuất',
  adjustment: 'Điều chỉnh',
};

const PURPOSE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  receipt: 'success',
  issue: 'warning',
  transfer: 'info',
  manufacture: 'info',
  adjustment: 'default',
};

const STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' }> = {
  draft: { label: 'Nháp', variant: 'neutral' },
  submitted: { label: 'Chờ duyệt', variant: 'warning' },
  posted: { label: 'Đã duyệt', variant: 'success' },
};

interface Props {
  open: boolean;
  entry: StockEntry | null;
  onClose: () => void;
}

export function StockEntryDetailModal({ open, entry, onClose }: Props) {
  const { data: warehousesData } = useGetMasterDataWarehousesListQuery();
  const { data: stockBalances } = useGetInventoryStockLedgerBalanceQuery({});
  const [updateStockEntry, { isLoading: isUpdating }] = usePostInventoryStockEntryByStockEntryIdUpdateMutation();
  const [approveStockIn, { isLoading: isApprovingIn }] = usePostInventoryStockInByStockEntryIdApproveMutation();
  const [approveStockIssue, { isLoading: isApprovingIssue }] = usePostInventoryStockIssueByStockEntryIdApproveMutation();
  const [approveStockTransfer, { isLoading: isApprovingTransfer }] = usePostInventoryStockTransferByStockEntryIdApproveMutation();
  
  const [localDetails, setLocalDetails] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (entry) {
      setLocalDetails(entry.details || []);
    }
  }, [entry]);

  if (!entry) return null;

  const isDraft = entry.status === 'draft';
  const isApproving = isApprovingIn || isApprovingIssue || isApprovingTransfer;
  const isWorking = isUpdating || isApproving;

  const statusInfo = STATUS_LABELS[entry.status || 'draft'] || { label: entry.status, variant: 'neutral' };
  const purposeType = entry.purpose || 'unknown';

  const handleWarehouseChange = (idx: number, field: 'source_warehouse_id' | 'target_warehouse_id', val: string) => {
    setLocalDetails(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: val || null
      };
      return next;
    });
  };

  const handleUpdateWarehouses = async () => {
    try {
      const payload = {
        remarks: entry.remarks,
        details: localDetails.map(detail => ({
          detail_id: detail.id,
          source_warehouse_id: detail.source_warehouse_id,
          target_warehouse_id: detail.target_warehouse_id,
          quantity: detail.quantity
        }))
      };
      await updateStockEntry({
        stockEntryId: entry.id!,
        stockEntryUpdateInput: payload
      }).unwrap();
      toast('success', 'Cập nhật kho hàng thành công');
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi cập nhật kho hàng');
    }
  };

  const handleApprove = async () => {
    for (const detail of localDetails) {
      if (purposeType === 'receipt' && !detail.target_warehouse_id) {
        toast('error', 'Vui lòng chọn Kho đến cho tất cả các dòng hàng.');
        return;
      }
      if (purposeType === 'issue' && !detail.source_warehouse_id) {
        toast('error', 'Vui lòng chọn Kho nguồn cho tất cả các dòng hàng.');
        return;
      }
      if (purposeType === 'transfer' && (!detail.source_warehouse_id || !detail.target_warehouse_id)) {
        toast('error', 'Vui lòng chọn đầy đủ Kho nguồn và Kho đến.');
        return;
      }

      if (purposeType === 'issue' || purposeType === 'transfer') {
        const balance = (stockBalances || []).find(
          (b: any) => b.warehouse_id === detail.source_warehouse_id && b.item_id === detail.item_id
        )?.total_quantity || 0;
        if (balance < (detail.quantity || 0)) {
          toast('error', `Không đủ tồn kho để xuất cho mặt hàng "${detail.item_name || detail.item_code}" (Yêu cầu: ${detail.quantity}, Hiện có: ${balance})`);
          return;
        }
      }
    }

    const isDirty = localDetails.some((local, idx) => {
      const original = entry.details?.[idx];
      return local.source_warehouse_id !== original?.source_warehouse_id || local.target_warehouse_id !== original?.target_warehouse_id;
    });

    try {
      if (isDirty) {
        const payload = {
          remarks: entry.remarks,
          details: localDetails.map(detail => ({
            detail_id: detail.id,
            source_warehouse_id: detail.source_warehouse_id,
            target_warehouse_id: detail.target_warehouse_id,
            quantity: detail.quantity
          }))
        };
        await updateStockEntry({
          stockEntryId: entry.id!,
          stockEntryUpdateInput: payload
        }).unwrap();
      }

      if (purposeType === 'receipt') {
        await approveStockIn({ stockEntryId: entry.id! }).unwrap();
      } else if (purposeType === 'issue') {
        await approveStockIssue({ stockEntryId: entry.id! }).unwrap();
      } else if (purposeType === 'transfer') {
        await approveStockTransfer({ stockEntryId: entry.id! }).unwrap();
      }

      toast('success', `Phê duyệt ${entry.name} thành công`);
      onClose();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chi Tiết Phiếu Kho: ${entry.name}`}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="ghost" onClick={onClose} disabled={isWorking}>Đóng</Button>
          {isDraft && (
            <>
              <Button variant="secondary" onClick={handleUpdateWarehouses} loading={isUpdating} disabled={isWorking}>
                Cập nhật Kho
              </Button>
              <Button variant="primary" onClick={handleApprove} loading={isApproving} disabled={isWorking}>
                Duyệt Phiếu
              </Button>
            </>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Loại phiếu</div>
            <Badge variant={PURPOSE_VARIANTS[purposeType] as any}>
              {purposeType === 'issue' && entry.sales_order_id ? 'Xuất kho' : (PURPOSE_LABELS[purposeType] || purposeType)}
            </Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Trạng thái</div>
            <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày tạo</div>
            <div>{formatDateTime(entry.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày ghi sổ</div>
            <div>{formatDateTime(entry.posting_date)}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Chi tiết ({localDetails.length || 0} mục)</div>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
              <thead style={{ background: 'var(--clr-surface-alt)', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Mặt hàng</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)', textAlign: 'right' }}>Số lượng</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Từ kho</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Đến kho</th>
                </tr>
              </thead>
              <tbody>
                {localDetails.map((detail: any, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{detail.item_name || detail.item_code || detail.item_id?.substring(0, 8)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{detail.quantity} {detail.uom_name || ''}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {isDraft && (purposeType === 'issue' || purposeType === 'transfer') ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <select
                            value={detail.source_warehouse_id || ''}
                            onChange={(e) => handleWarehouseChange(idx, 'source_warehouse_id', e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', width: '100%', fontSize: 'var(--fs-sm)' }}
                            disabled={isWorking}
                          >
                            <option value="">-- Chọn kho --</option>
                            {(warehousesData || []).map(wh => (
                              <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                          </select>
                          {(() => {
                            if (!detail.source_warehouse_id) return null;
                            const balance = (stockBalances || []).find(
                              (b: any) => b.warehouse_id === detail.source_warehouse_id && b.item_id === detail.item_id
                            )?.total_quantity || 0;
                            const isSufficient = balance >= (detail.quantity || 0);
                            return (
                              <div style={{ 
                                fontSize: '11px', 
                                marginTop: '4px', 
                                color: isSufficient ? 'var(--clr-success)' : 'var(--clr-error)',
                                fontWeight: 600
                              }}>
                                Tồn: {balance} ({isSufficient ? 'Đủ' : `Thiếu ${detail.quantity - balance}`})
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        detail.source_warehouse_name || detail.source_warehouse_id?.substring(0, 8) || '—'
                      )}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {isDraft && (purposeType === 'receipt' || purposeType === 'transfer') ? (
                        <select
                          value={detail.target_warehouse_id || ''}
                          onChange={(e) => handleWarehouseChange(idx, 'target_warehouse_id', e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', width: '100%', fontSize: 'var(--fs-sm)' }}
                          disabled={isWorking}
                        >
                          <option value="">-- Chọn kho --</option>
                          {(warehousesData || []).map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                          ))}
                        </select>
                      ) : (
                        detail.target_warehouse_name || detail.target_warehouse_id?.substring(0, 8) || '—'
                      )}
                    </td>
                  </tr>
                ))}
                {localDetails.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Không có chi tiết</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {entry.remarks && (
          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-1)' }}>Ghi chú</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', background: 'var(--clr-surface-alt)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
              {entry.remarks}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
