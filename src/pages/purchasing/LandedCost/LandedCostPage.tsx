import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  useGetPurchasingShipmentsQuery, 
  usePostPurchasingShipmentsMutation, 
  usePutPurchasingShipmentsByPkMutation,
  usePostPurchasingShipmentsByPkCompleteMutation,
  useGetPurchasingOrdersQuery
} from '@entities/purchasing/api/purchasingApi';
import { useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Plus, Package, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { shortId } from '@shared/lib/shortId';
import styles from './LandedCostPage.module.css';

// Schema validation for completing shipment
const completeFormSchema = z.object({
  total_logistic_fees: z.number({ message: 'Chi phí logistic phải là số' }).min(0, 'Chi phí logistic không được âm'),
  remarks: z.string().optional(),
  details: z.array(
    z.object({
      po_line_id: z.string(),
      item_id: z.string(),
      item_code: z.string(),
      item_name: z.string(),
      ordered_quantity: z.number(),
      quantity: z.number({ message: 'Số lượng phải là số' }).min(0, 'Số lượng không được âm'),
      target_warehouse_id: z.string().nullable().optional(),
    }).refine(
      (data) => {
        if (data.quantity > 0 && !data.target_warehouse_id) {
          return false;
        }
        return true;
      },
      {
        message: 'Bắt buộc chọn kho khi số lượng nhận lớn hơn 0',
        path: ['target_warehouse_id'],
      }
    ).refine(
      (data) => {
        return data.quantity <= data.ordered_quantity;
      },
      {
        message: 'Số lượng nhận không được vượt quá số lượng đặt',
        path: ['quantity'],
      }
    )
  ),
});

type CompleteFormValues = z.infer<typeof completeFormSchema>;

export const LandedCostPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryShipmentId = searchParams.get('id');
  const { data: shipments = [], isLoading: isLoadingShipments, refetch: refetchShipments } = useGetPurchasingShipmentsQuery();
  const { data: purchaseOrders = [] } = useGetPurchasingOrdersQuery();
  const { data: warehouses = [] } = useGetMasterDataWarehousesListQuery();
  
  const [createShipment] = usePostPurchasingShipmentsMutation();
  const [updateShipment] = usePutPurchasingShipmentsByPkMutation();
  const [completeShipment, { isLoading: isCompleting }] = usePostPurchasingShipmentsByPkCompleteMutation();

  const activeShipment = useMemo(() => {
    if (!queryShipmentId || shipments.length === 0) return null;
    return shipments.find((s) => s.id === queryShipmentId || s.shipment_num === queryShipmentId) || null;
  }, [queryShipmentId, shipments]);

  const activeShipmentId = activeShipment?.id || null;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isConfirmZeroModalOpen, setIsConfirmZeroModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CompleteFormValues | null>(null);

  // Form states for creating shipment
  const [shipmentNum, setShipmentNum] = useState('');
  const [shipmentName, setShipmentName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<string | null>(null);
  const [isNameUserEdited, setIsNameUserEdited] = useState(false);
  const [createError, setCreateError] = useState('');
  const [completeError, setCompleteError] = useState('');

  // Local state for inline logistics fee in inspecting state
  const [logisticFees, setLogisticFees] = useState('0');

  // React Hook Form for shipment completion
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
    reset,
  } = useForm<CompleteFormValues>({
    resolver: zodResolver(completeFormSchema),
    defaultValues: {
      total_logistic_fees: 0,
      remarks: '',
      details: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'details',
  });

  // Available POs: status PENDING/PAID_UNSHIPPED, exclude POs that already have active shipments
  const activePoIds = useMemo(() => {
    return new Set(
      shipments
        .filter((s) => s.status !== 'completed' && s.purchase_order)
        .map((s) => s.purchase_order)
    );
  }, [shipments]);

  const availablePurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(
      (po) =>
        po.id &&
        (po.status === 'pending' || po.status === 'paid_unshipped') &&
        !activePoIds.has(po.id)
    );
  }, [purchaseOrders, activePoIds]);

  // Synchronize inline logistics fee and initial state when shipment selection changes
  const [prevActiveShipmentId, setPrevActiveShipmentId] = useState<string | null>(null);
  if (activeShipmentId !== prevActiveShipmentId) {
    setPrevActiveShipmentId(activeShipmentId);
    if (activeShipment) {
      setLogisticFees(activeShipment.total_logistic_fees ? String(activeShipment.total_logistic_fees) : '0');
      
      const lines = activeShipment.purchase_order_lines || [];
      reset({
        total_logistic_fees: activeShipment.total_logistic_fees ? parseFloat(String(activeShipment.total_logistic_fees)) : 0,
        remarks: activeShipment.remarks || '',
        details: lines.map((line) => {
          const matched = activeShipment.stock_entries_details?.find((r) => r.item_id === line.item_id);
          return {
            po_line_id: line.id || '',
            item_id: line.item_id || '',
            item_code: line.item_code || '',
            item_name: line.item_name || '',
            ordered_quantity: parseFloat(String(line.quantity)) || 0,
            quantity: matched ? parseFloat(String(matched.quantity)) : parseFloat(String(line.quantity)) || 0,
            target_warehouse_id: matched ? (matched.target_warehouse_id || '') : '',
          };
        }),
      });
    } else {
      setLogisticFees('0');
      reset({
        total_logistic_fees: 0,
        remarks: '',
        details: [],
      });
    }
  }

  // Handle PO selection and auto shipment name suggestion
  const [prevSelectedPOId, setPrevSelectedPOId] = useState<string | null>(null);
  if (selectedPurchaseOrderId !== prevSelectedPOId) {
    setPrevSelectedPOId(selectedPurchaseOrderId);
    if (selectedPurchaseOrderId && !isNameUserEdited) {
      const po = purchaseOrders.find(p => p.id === selectedPurchaseOrderId);
      if (po) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const dateStr = `${dd}/${mm}/${yyyy}`;
        setShipmentName(`Lô hàng ${po.vendor_name || 'NCC'} - ${dateStr}`);
      }
    }
  }

  // Auto-generate name when modal opens
  const [prevIsCreateModalOpen, setPrevIsCreateModalOpen] = useState(false);
  if (isCreateModalOpen !== prevIsCreateModalOpen) {
    setPrevIsCreateModalOpen(isCreateModalOpen);
    if (!isCreateModalOpen) {
      setShipmentNum('');
      setShipmentName('');
      setSelectedPurchaseOrderId(null);
      setRemarks('');
      setIsNameUserEdited(false);
      setCreateError('');
    }
  }

  const selectedPO = useMemo(() => {
    return purchaseOrders.find((po) => po.id === selectedPurchaseOrderId);
  }, [purchaseOrders, selectedPurchaseOrderId]);

  // Match PO lines with received details for active shipment
  const matchedDetails = useMemo(() => {
    if (!activeShipment) return [];
    const lines = activeShipment.purchase_order_lines || [];
    const received = activeShipment.stock_entries_details || [];
    
    return lines.map((line) => {
      const matched = received.find((r) => r.item_id === line.item_id);
      return {
        id: line.id,
        item_id: line.item_id,
        item_code: line.item_code,
        item_name: line.item_name,
        ordered_quantity: parseFloat(String(line.quantity)) || 0,
        unit: line.unit,
        received_quantity: matched ? parseFloat(String(matched.quantity)) : 0,
        target_warehouse_name: matched ? matched.target_warehouse_name : null,
      };
    });
  }, [activeShipment]);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!shipmentNum.trim() || !shipmentName.trim() || !selectedPurchaseOrderId) {
      setCreateError('Vui lòng điền đầy đủ Mã, Tên và Đơn mua hàng.');
      return;
    }

    try {
      const result = await createShipment({
        shipmentInput: {
          shipment_num: shipmentNum.trim(),
          name: shipmentName.trim(),
          remarks: remarks.trim() || null,
          purchase_order_id: selectedPurchaseOrderId,
        }
      }).unwrap();
      
      setRemarks('');
      setSelectedPurchaseOrderId(null);
      setIsCreateModalOpen(false);
      refetchShipments();
      
      if (result.id) {
        const params = new URLSearchParams(searchParams);
        params.set('id', result.id);
        setSearchParams(params);
      }
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      setCreateError(error?.data?.detail || 'Có lỗi xảy ra khi tạo lô hàng.');
    }
  };

  const handleConfirmArrival = async () => {
    if (!activeShipmentId) return;
    try {
      await updateShipment({
        pk: activeShipmentId,
        body: { status: 'inspecting' }
      }).unwrap();
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      alert(error?.data?.detail || 'Không thể cập nhật trạng thái lô hàng sang Đang tiếp nhận.');
    }
  };

  const handleOpenCompleteModal = async () => {
    if (!activeShipment) return;
    
    // Validate inline details form fields
    const isValid = await trigger('details');
    if (!isValid) return;

    setValue('total_logistic_fees', parseFloat(logisticFees) || 0);
    setValue('remarks', activeShipment.remarks || '');
    
    setCompleteError('');
    setIsCompleteModalOpen(true);
  };

  const onCompleteSubmit = async (data: CompleteFormValues) => {
    if (!activeShipmentId) return;
    setCompleteError('');
    
    const allZero = data.details.every((d) => d.quantity === 0);
    if (allZero) {
      setPendingFormData(data);
      setIsConfirmZeroModalOpen(true);
      return;
    }

    await doComplete(data);
  };

  const handleConfirmZero = async () => {
    if (!pendingFormData) return;
    setIsConfirmZeroModalOpen(false);
    await doComplete(pendingFormData);
    setPendingFormData(null);
  };

  const doComplete = async (data: CompleteFormValues) => {
    if (!activeShipmentId) return;
    try {
      const payloadDetails = data.details.map((d) => ({
        po_line_id: d.po_line_id,
        item_id: d.item_id,
        quantity: d.quantity,
        target_warehouse_id: d.quantity > 0 ? (d.target_warehouse_id || null) : null,
      }));

      await completeShipment({
        pk: activeShipmentId,
        shipmentCompleteInput: {
          total_logistic_fees: data.total_logistic_fees,
          details: payloadDetails,
        },
      }).unwrap();

      // Update remarks if edited
      if (activeShipment && data.remarks !== undefined && data.remarks !== activeShipment.remarks) {
        await updateShipment({
          pk: activeShipmentId,
          body: { remarks: data.remarks }
        }).unwrap();
      }

      setIsCompleteModalOpen(false);
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string; error?: string } };
      setCompleteError(error?.data?.error || error?.data?.detail || 'Có lỗi xảy ra khi hoàn tất lô hàng.');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral">Chờ Hàng Về</Badge>;
      case 'inspecting':
        return <Badge variant="info">Đang Tiếp Nhận</Badge>;
      case 'completed':
        return <Badge variant="success">Hoàn Tất</Badge>;
      default:
        return <Badge variant="neutral">Không rõ</Badge>;
    }
  };

  const warehouseOptions = useMemo(() => {
    return [
      { label: '-- Chọn Kho Đích --', value: '' },
      ...warehouses.map((w) => ({ label: w.name || '', value: w.id || '' })),
    ];
  }, [warehouses]);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Left Side: Shipments list */}
        <div className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Hồ sơ Lô hàng</h3>
            <Button 
              size="sm" 
              icon={<Plus size={14} />} 
              onClick={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const rand = Math.floor(1000 + Math.random() * 9000);
                setShipmentNum(`LH-${yyyy}${mm}${dd}-${rand}`);
                setIsCreateModalOpen(true);
              }}
            >
              Tạo Lô Hàng
            </Button>
          </div>

          {isLoadingShipments ? (
            <div className={styles.loading}>Đang tải danh sách lô hàng...</div>
          ) : shipments.length === 0 ? (
            <div className={styles.empty}>Không có lô hàng nào. Hãy tạo mới lô hàng để quản lý nhận hàng.</div>
          ) : (
            <div className={styles.shipmentList}>
              {shipments.map((s) => (
                <div 
                  key={s.id} 
                  className={`${styles.shipmentCard} ${activeShipmentId === s.id ? styles.activeCard : ''}`}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    if (s.id) {
                      params.set('id', s.id);
                    } else {
                      params.delete('id');
                    }
                    setSearchParams(params);
                  }}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.shipmentNum}>{s.shipment_num}</span>
                    {getStatusBadge(s.status)}
                  </div>
                  <h4 className={styles.shipmentName}>{s.name}</h4>
                  <div className={styles.cardMeta}>
                    <span>
                      <Package size={12} style={{ marginRight: '4px' }} />
                      {s.purchase_order_lines?.length || 0} mặt hàng
                    </span>
                    {s.total_logistic_fees ? (
                      <span className={styles.feeText}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.total_logistic_fees)}
                      </span>
                    ) : (
                      <span className={styles.pendingFee}>Chưa có Landed Cost</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Shipment details & Operations */}
        <div className={styles.detailSection}>
          {activeShipment ? (
            <div className={styles.detailWrap}>
              <div className={styles.detailHeader}>
                <div>
                  <div className={styles.detailSub}>Mã lô hàng: {activeShipment.shipment_num}</div>
                  <h2 className={styles.detailTitle}>{activeShipment.name}</h2>
                </div>
                <div className={styles.statusHeaderBlock}>
                  {activeShipment.status === 'draft' && (
                    <Button 
                      variant="primary" 
                      onClick={handleConfirmArrival}
                    >
                      Xác nhận hàng về (Bắt đầu tiếp nhận)
                    </Button>
                  )}
                  {activeShipment.status === 'inspecting' && (
                    <Button 
                      variant="primary" 
                      icon={<ClipboardCheck size={16} />}
                      onClick={handleOpenCompleteModal}
                    >
                      Xác Nhận Hoàn Tất
                    </Button>
                  )}
                </div>
              </div>

              {activeShipment.remarks && (
                <div className={styles.remarksBox}>
                  <strong>Ghi chú:</strong> {activeShipment.remarks}
                </div>
              )}

              <div className={styles.feeSummary}>
                {activeShipment.status === 'inspecting' ? (
                  <div className={styles.logisticInputGroup}>
                    <label className={styles.logisticInputLabel}>Chi phí Logistic / Vận chuyển ước tính (VND) <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className={styles.logisticInputField}
                      placeholder="Nhập chi phí vận chuyển ước tính..."
                      value={logisticFees}
                      onChange={(e) => setLogisticFees(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className={styles.feeLabel}>Chi phí dồn tích Lô hàng (Landed Cost):</div>
                    <div className={styles.feeValue}>
                      {activeShipment.total_logistic_fees
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeShipment.total_logistic_fees)
                        : 'Chưa ghi nhận'}
                    </div>
                  </>
                )}
              </div>

              <div className={styles.entriesSection}>
                <h4 className={styles.entriesTitle}>Bảng Tiếp Nhận Hàng Hóa</h4>
                
                {matchedDetails.length > 0 ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Sản Phẩm</th>
                          <th style={{ width: '120px' }}>Số Lượng Đặt</th>
                          <th style={{ width: '160px' }}>Số Lượng Đạt Chuẩn</th>
                          <th>Kho Nhập hàng</th>
                          <th style={{ width: '180px' }}>Kết Quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeShipment.status === 'inspecting'
                          ? fields.map((field, index) => {
                              const itemQty = watch(`details.${index}.quantity`);
                              const poLine = activeShipment.purchase_order_lines?.find(l => l.id === field.po_line_id);
                              const unit = poLine?.unit || '';
                              return (
                                <tr key={field.id}>
                                  <td>
                                    <div className={styles.itemMeta}>
                                      <span className={styles.itemCode}>{field.item_code}</span>
                                      <span className={styles.itemName}>{field.item_name}</span>
                                    </div>
                                  </td>
                                  <td>{field.ordered_quantity} {unit}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className={styles.inputNumber}
                                      min="0"
                                      step="0.01"
                                      style={{ width: '100%' }}
                                      {...register(`details.${index}.quantity`, { valueAsNumber: true })}
                                    />
                                    {errors.details?.[index]?.quantity && (
                                      <span className={styles.errorText}>
                                        {errors.details?.[index]?.quantity?.message}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <select
                                      className={styles.selectWarehouse}
                                      disabled={itemQty === 0}
                                      style={{ margin: 0, width: '100%' }}
                                      {...register(`details.${index}.target_warehouse_id`)}
                                    >
                                      {warehouseOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    {errors.details?.[index]?.target_warehouse_id && (
                                      <span className={styles.errorText}>
                                        {errors.details?.[index]?.target_warehouse_id?.message}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <Badge variant="info">Đang Tiếp Nhận</Badge>
                                  </td>
                                </tr>
                              );
                            })
                          : matchedDetails.map((detail) => {
                              return (
                                <tr key={detail.id}>
                                  <td>
                                    <div className={styles.itemMeta}>
                                      <span className={styles.itemCode}>{detail.item_code}</span>
                                      <span className={styles.itemName}>{detail.item_name}</span>
                                    </div>
                                  </td>
                                  <td>{detail.ordered_quantity} {detail.unit}</td>
                                  <td>
                                    {activeShipment.status === 'completed' ? (
                                      detail.received_quantity
                                    ) : (
                                      <span style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>---</span>
                                    )}
                                  </td>
                                  <td>
                                    {activeShipment.status === 'completed' ? (
                                      detail.target_warehouse_name || '---'
                                    ) : (
                                      <span style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>---</span>
                                    )}
                                  </td>
                                  <td>
                                    {activeShipment.status === 'completed' ? (
                                      detail.received_quantity > 0 ? (
                                        <Badge variant="success">Đạt: {detail.received_quantity}/{detail.ordered_quantity}</Badge>
                                      ) : (
                                        <div className={styles.failedText}>
                                          <AlertTriangle size={11} />
                                          <span>Từ chối nhận (0/{detail.ordered_quantity})</span>
                                        </div>
                                      )
                                    ) : (
                                      <Badge variant="neutral">Chờ Hàng Về</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.noEntries}>Không có dòng sản phẩm nào trong lô hàng này.</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <Package size={48} className={styles.placeholderIcon} />
              <h3>Chọn một lô hàng để làm việc</h3>
              <p>Chọn một lô hàng từ danh sách bên trái để thực hiện quy trình tiếp nhận hàng hóa và phân bổ chi phí landed cost.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Shipment */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Hồ Sơ Lô Hàng Mới"
        size="lg"
      >
        <form onSubmit={handleCreateShipment} className={styles.form}>
          {createError && <div className={styles.errorAlert}>{createError}</div>}
          <div className={styles.formRow}>
            <Input 
              label="Mã Lô Hàng" 
              placeholder="LH-YYYYMMDD-XXXX"
              value={shipmentNum}
              onChange={(e) => setShipmentNum(e.target.value)}
              required
            />
            <Input 
              label="Tên Lô Hàng / Mô tả hồ sơ" 
              placeholder="VD: Lô hàng [Nhà Cung Cấp] - [Ngày]"
              value={shipmentName}
              onChange={(e) => {
                setShipmentName(e.target.value);
                setIsNameUserEdited(true);
              }}
              required
            />
          </div>
          <Input 
            label="Ghi Chú" 
            placeholder="Ghi chú thêm về lô hàng..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className={styles.selectEntriesBox}>
            <label className={styles.selectEntriesTitle}>Chọn Đơn Mua Hàng (PO) liên kết <span style={{ color: 'var(--clr-error)' }}>*</span></label>
            <p className={styles.selectEntriesDesc}>Chọn một đơn mua hàng ở trạng thái chờ xử lý hoặc đã thanh toán để liên kết với lô hàng này.</p>
            
            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
              <select
                className={styles.selectWarehouse}
                value={selectedPurchaseOrderId || ''}
                onChange={(e) => setSelectedPurchaseOrderId(e.target.value || null)}
                required
              >
                <option value="">-- Chọn đơn mua hàng (PO) --</option>
                {availablePurchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {shortId(po.id)}... (NCC: {po.vendor_name}, Trị giá: {po.total_amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(po.total_amount) : '---'})
                  </option>
                ))}
              </select>
            </div>

            {selectedPO && (
              <div style={{
                background: 'var(--clr-bg-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--br-md)',
                padding: '16px',
                marginTop: '12px'
              }}>
                <h5 style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sm)', marginBottom: '8px' }}>Chi tiết Đơn hàng:</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedPO.lines?.map((line) => (
                    <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                      <span>{line.item_name} ({line.item_code})</span>
                      <strong>{line.quantity}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy bỏ</Button>
            <Button type="submit" variant="primary">Khởi tạo lô hàng</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Complete Shipment */}
      <Modal
        open={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Tiếp Nhận & Hoàn Tất Lô Hàng"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCompleteSubmit)} className={styles.form}>
          {completeError && <div className={styles.errorAlert}>{completeError}</div>}
          
          <div className={styles.formRow}>
            <Input
              label="Chi phí vận chuyển thực tế (VND)"
              type="number"
              min="0"
              step="1000"
              error={errors.total_logistic_fees?.message}
              required
              {...register('total_logistic_fees', { valueAsNumber: true })}
            />
            <Input
              label="Ghi chú hoàn tất"
              placeholder="Ghi chú khi hoàn tất nhận hàng..."
              error={errors.remarks?.message}
              {...register('remarks')}
            />
          </div>

          <div className={styles.entriesSection} style={{ marginTop: '16px' }}>
            <h4 className={styles.entriesTitle}>Số Lượng Thực Nhận & Chỉ Định Kho Đích (Review)</h4>
            
            <div className={styles.tableWrap} style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sản Phẩm</th>
                    <th style={{ width: '100px' }}>Số Lượng Đặt</th>
                    <th style={{ width: '140px' }}>Số Lượng Đạt</th>
                    <th style={{ width: '220px' }}>Kho Nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const targetWarehouseId = watch(`details.${index}.target_warehouse_id`);
                    const warehouse = warehouses.find((w) => w.id === targetWarehouseId);
                    return (
                      <tr key={field.id}>
                        <td>
                          <div className={styles.itemMeta}>
                            <span className={styles.itemCode}>{field.item_code}</span>
                            <span className={styles.itemName}>{field.item_name}</span>
                          </div>
                        </td>
                        <td>{field.ordered_quantity}</td>
                        <td>{watch(`details.${index}.quantity`)}</td>
                        <td>{warehouse?.name || '---'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.formFooter} style={{ marginTop: '24px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCompleteModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={isCompleting}>Xác nhận Hoàn Tất</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Zero-All Acceptance */}
      <Modal
        open={isConfirmZeroModalOpen}
        onClose={() => {
          setIsConfirmZeroModalOpen(false);
          setPendingFormData(null);
        }}
        title="Xác nhận từ chối nhận toàn bộ"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsConfirmZeroModalOpen(false);
                setPendingFormData(null);
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmZero}
            >
              Xác nhận từ chối
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} color="var(--clr-warning, #f59e0b)" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--clr-text, #0f172a)' }}>
            Tất cả sản phẩm có số lượng nhận là 0. Hệ thống sẽ ghi nhận lô hàng này là{' '}
            <strong>từ chối nhận toàn bộ</strong> và KHÔNG tạo phiếu nhập kho. Bạn có chắc chắn muốn tiếp tục?
          </p>
        </div>
      </Modal>
    </div>
  );
};
