import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  useGetPurchasingShipmentsQuery, 
  usePostPurchasingShipmentsMutation, 
  usePostPurchasingShipmentsAllocateMutation,
  usePutPurchasingShipmentsByPkMutation,
  usePostPurchasingCertificationsMutation
} from '@entities/purchasing/api/purchasingApi';
import { 
  useGetInventoryStockEntryListQuery,
  usePostInventoryStockEntryByStockEntryIdUpdateMutation,
  usePostInventoryStockInByStockEntryIdApproveMutation
} from '@features/inventory/api/inventoryApi';
import { useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Plus, Package, Calendar, Info, CheckCircle2, ShieldCheck, Check, AlertTriangle } from 'lucide-react';
import styles from './LandedCostPage.module.css';

export const LandedCostPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryShipmentId = searchParams.get('shipmentId');
  const { data: shipments = [], isLoading: isLoadingShipments, refetch: refetchShipments } = useGetPurchasingShipmentsQuery();
  const { data: stockEntriesRes } = useGetInventoryStockEntryListQuery({ purpose: 'receipt' });
  const { data: warehouses = [] } = useGetMasterDataWarehousesListQuery();
  
  const [createShipment] = usePostPurchasingShipmentsMutation();
  const [allocateLandedCost] = usePostPurchasingShipmentsAllocateMutation();
  const [updateShipment] = usePutPurchasingShipmentsByPkMutation();
  const [updateStockEntry] = usePostInventoryStockEntryByStockEntryIdUpdateMutation();
  const [approveStockIn] = usePostInventoryStockInByStockEntryIdApproveMutation();
  const [postQC] = usePostPurchasingCertificationsMutation();

  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating shipment
  const [shipmentNum, setShipmentNum] = useState('');
  const [shipmentName, setShipmentName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedStockEntryIds, setSelectedStockEntryIds] = useState<string[]>([]);
  const [isNameUserEdited, setIsNameUserEdited] = useState(false);
  const [createError, setCreateError] = useState('');

  // Form states for allocating landed cost
  const [logisticFees, setLogisticFees] = useState('');

  // QA/QC Form states
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [qcItem, setQcItem] = useState<{ id: string; item_id: string; item_code: string; item_name: string; stock_entry_id: string } | null>(null);
  const [qcResult, setQcResult] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [qcRemarks, setQcRemarks] = useState('');
  const [qcError, setQcError] = useState('');

  // Storekeeper local inputs (warehouse assignments, received quantity)
  const [localDetails, setLocalDetails] = useState<Record<string, { quantity: number; target_warehouse_id: string | null }>>({});
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState('');

  // Filter stock entries that are receipts, draft or posted, and not linked to any shipment
  const availableStockEntries = useMemo(() => {
    if (!stockEntriesRes) return [];
    const entries = 'results' in stockEntriesRes ? (stockEntriesRes.results || []) : (Array.isArray(stockEntriesRes) ? stockEntriesRes : []);
    
    // Find all stock entry IDs currently linked to shipments
    const linkedIds = new Set(
      shipments.flatMap((s) => s.stock_entries?.map((se) => se.id) || [])
    );
    
    return entries.filter(
      (entry) => entry.purpose === 'receipt' && !linkedIds.has(entry.id)
    );
  }, [stockEntriesRes, shipments]);

  const activeShipment = useMemo(() => {
    return shipments.find((s) => s.id === activeShipmentId);
  }, [shipments, activeShipmentId]);

  useEffect(() => {
    if (queryShipmentId && shipments.length > 0) {
      const matched = shipments.find((s) => s.id === queryShipmentId || s.shipment_num === queryShipmentId);
      if (matched && matched.id !== activeShipmentId) {
        setActiveShipmentId(matched.id || null);
      }
    }
  }, [queryShipmentId, shipments, activeShipmentId]);

  const [prevActiveShipmentId, setPrevActiveShipmentId] = useState<string | null>(null);
  if (activeShipmentId !== prevActiveShipmentId) {
    setPrevActiveShipmentId(activeShipmentId);
    if (activeShipment) {
      if (activeShipment.stock_entries_details) {
        const initialDetails: Record<string, { quantity: number; target_warehouse_id: string | null }> = {};
        activeShipment.stock_entries_details.forEach((det) => {
          initialDetails[det.id!] = {
            quantity: det.quantity || 0,
            target_warehouse_id: det.target_warehouse_id || null,
          };
        });
        setLocalDetails(initialDetails);
      }
      setLogisticFees(activeShipment.total_logistic_fees ? String(activeShipment.total_logistic_fees) : '0');
    } else {
      setLocalDetails({});
      setLogisticFees('0');
    }
  }

  const [prevIsCreateModalOpen, setPrevIsCreateModalOpen] = useState(false);
  const [prevSelectedStockEntryIds, setPrevSelectedStockEntryIds] = useState<string[]>([]);
  
  const isSelectedChanged = selectedStockEntryIds.length !== prevSelectedStockEntryIds.length || 
    selectedStockEntryIds.some((val, idx) => val !== prevSelectedStockEntryIds[idx]);

  if (isCreateModalOpen !== prevIsCreateModalOpen || isSelectedChanged) {
    setPrevIsCreateModalOpen(isCreateModalOpen);
    setPrevSelectedStockEntryIds(selectedStockEntryIds);
    if (isCreateModalOpen) {
      if (!isNameUserEdited) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const dateStr = `${dd}/${mm}/${yyyy}`;

        if (selectedStockEntryIds.length === 0) {
          setShipmentName(`Lô hàng mới - ${dateStr}`);
        } else {
          const selectedEntries = availableStockEntries.filter((e) => selectedStockEntryIds.includes(e.id!));
          const vendors = Array.from(new Set(selectedEntries.map((e) => e.vendor_name).filter(Boolean)));

          if (vendors.length === 0) {
            setShipmentName(`Lô hàng mới - ${dateStr}`);
          } else if (vendors.length === 1) {
            setShipmentName(`Lô hàng ${vendors[0]} - ${dateStr}`);
          } else {
            setShipmentName(`Lô hàng tổng hợp - ${dateStr}`);
          }
        }
      }
    } else {
      setShipmentNum('');
      setShipmentName('');
      setIsNameUserEdited(false);
    }
  }

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!shipmentNum.trim() || !shipmentName.trim()) {
      setCreateError('Vui lòng điền đầy đủ Mã và Tên lô hàng.');
      return;
    }

    try {
      await createShipment({
        shipmentInput: {
          shipment_num: shipmentNum.trim(),
          name: shipmentName.trim(),
          remarks: remarks.trim() || null,
          stock_entry_ids: selectedStockEntryIds,
        }
      }).unwrap();
      
      setRemarks('');
      setSelectedStockEntryIds([]);
      setIsCreateModalOpen(false);
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      setCreateError(error?.data?.detail || 'Có lỗi xảy ra khi tạo lô hàng.');
    }
  };



  const handleQcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQcError('');
    if (!qcItem) return;

    try {
      await postQC({
        technicalCertificationCreateInput: {
          item_id: qcItem.item_id,
          stock_entry_id: qcItem.stock_entry_id,
          cert_type: 'Kiểm định chất lượng ngoại quan & thông số kỹ thuật',
          result: qcResult,
          remarks: qcRemarks.trim() || null,
        }
      }).unwrap();

      setIsQcModalOpen(false);
      setQcItem(null);
      setQcRemarks('');
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      setQcError(error?.data?.detail || 'Có lỗi xảy ra khi tạo chứng nhận QA/QC.');
    }
  };

  const handleConfirmArrival = async () => {
    if (!activeShipmentId) return;
    try {
      await updateShipment({
        pk: activeShipmentId,
        body: { status: 'arrived' }
      }).unwrap();
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      alert(error?.data?.detail || 'Không thể cập nhật trạng thái lô hàng sang Arrived.');
    }
  };

  const handleConfirmQCFinished = async () => {
    if (!activeShipmentId || !activeShipment) return;
    
    // Check if all items have been QC-ed
    const uninspected = activeShipment.stock_entries_details?.filter((d) => !d.latest_cert);
    if (uninspected && uninspected.length > 0) {
      const confirmForce = window.confirm(
        `Vẫn còn ${uninspected.length} sản phẩm chưa được kiểm định chất lượng. Bạn có chắc muốn hoàn tất QC sớm?`
      );
      if (!confirmForce) return;
    }

    try {
      await updateShipment({
        pk: activeShipmentId,
        body: { status: 'inspected' }
      }).unwrap();
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      alert(error?.data?.detail || 'Không thể hoàn tất kiểm định QA/QC.');
    }
  };

  const handleConfirmReceiving = async () => {
    if (!activeShipment || !activeShipment.stock_entries) return;
    setReceiveError('');
    setIsReceiving(true);

    try {
      const entries = activeShipment.stock_entries;
      
      // 1. Perform validation first
      const feeAmount = parseFloat(logisticFees);
      if (isNaN(feeAmount) || feeAmount <= 0) {
        throw new Error('Vui lòng nhập chi phí Logistic hợp lệ (lớn hơn 0).');
      }

      for (const entry of entries) {
        const entryDetails = activeShipment.stock_entries_details?.filter((d) => d.stock_entry_id === entry.id) || [];
        for (const det of entryDetails) {
          const local = localDetails[det.id!];
          if (det.qc_status === 'PASSED') {
            if (!local || !local.target_warehouse_id) {
              throw new Error(`Sản phẩm ${det.item_code} (${det.item_name}) đạt kiểm định nhưng chưa được chỉ định kho đích.`);
            }
            if (!local.quantity || local.quantity <= 0) {
              throw new Error(`Số lượng thực nhận của sản phẩm đạt QC ${det.item_code} phải lớn hơn 0.`);
            }
          }
        }
      }

      // 2. Perform updates and approve stock entries
      for (const entry of entries) {
        const entryDetails = activeShipment.stock_entries_details?.filter((d) => d.stock_entry_id === entry.id) || [];
        const updates = entryDetails.map((det) => {
          const local = localDetails[det.id!];
          return {
            detail_id: det.id!,
            target_warehouse_id: det.qc_status === 'PASSED' ? local.target_warehouse_id : null,
            quantity: det.qc_status === 'PASSED' ? Number(local.quantity) : 0, // FAILED items received as 0
          };
        });

        // Update Stock Entry values
        await updateStockEntry({
          stockEntryId: entry.id!,
          stockEntryUpdateInput: { details: updates }
        }).unwrap();

        // Post/Approve the Stock Entry
        await approveStockIn({
          stockEntryId: entry.id!
        }).unwrap();
      }

      // 3. Allocate logistic fee to complete the shipment
      if (activeShipmentId) {
        await allocateLandedCost({
          landedCostAllocationInput: {
            shipment_id: activeShipmentId,
            total_logistic_fees: feeAmount,
          }
        }).unwrap();
      }

      setLogisticFees('');
      refetchShipments();
    } catch (err: unknown) {
      const error = err as { message?: string; data?: { detail?: string } };
      setReceiveError(error.message || error?.data?.detail || 'Có lỗi xảy ra khi xác nhận nhận hàng.');
    } finally {
      setIsReceiving(false);
    }
  };

  const toggleStockEntrySelection = (id: string) => {
    setSelectedStockEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLocalWarehouseChange = (detailId: string, whId: string) => {
    setLocalDetails((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        target_warehouse_id: whId || null,
      }
    }));
  };

  const handleLocalQuantityChange = (detailId: string, qty: string) => {
    const num = parseFloat(qty) || 0;
    setLocalDetails((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        quantity: num,
      }
    }));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral">Nháp (Đang đi đường)</Badge>;
      case 'arrived':
        return <Badge variant="warning">Đã cập bến (Chờ QC)</Badge>;
      case 'inspected':
        return <Badge variant="info">Đã QC (Chờ nhận hàng)</Badge>;
      case 'completed':
        return <Badge variant="success">Hoàn tất</Badge>;
      default:
        return <Badge variant="neutral">Không rõ</Badge>;
    }
  };

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
            <div className={styles.empty}>Không có lô hàng nào. Hãy tạo mới lô hàng để quản lý nhận hàng và kiểm định.</div>
          ) : (
            <div className={styles.shipmentList}>
              {shipments.map((s) => (
                <div 
                  key={s.id} 
                  className={`${styles.shipmentCard} ${activeShipmentId === s.id ? styles.activeCard : ''}`}
                  onClick={() => setActiveShipmentId(s.id || null)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.shipmentNum}>{s.shipment_num}</span>
                    {getStatusBadge(s.status)}
                  </div>
                  <h4 className={styles.shipmentName}>{s.name}</h4>
                  <div className={styles.cardMeta}>
                    <span>
                      <Package size={12} style={{ marginRight: '4px' }} />
                      {s.stock_entries?.length || 0} phiếu kho
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
                      Xác nhận hàng về (Arrived)
                    </Button>
                  )}
                  {activeShipment.status === 'arrived' && (
                    <Button 
                      variant="primary" 
                      icon={<ShieldCheck size={16} />}
                      onClick={handleConfirmQCFinished}
                    >
                      Hoàn tất Kiểm định QC
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
                {activeShipment.status === 'inspected' ? (
                  <div className={styles.logisticInputGroup}>
                    <label className={styles.logisticInputLabel}>Chi phí Logistic / Vận chuyển (VND) <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className={styles.logisticInputField}
                      placeholder="Nhập chi phí vận chuyển (nhập 0 nếu không có)..."
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
                {activeShipment.status === 'completed' && (
                  <div className={styles.completedBanner}>
                    <CheckCircle2 size={16} className={styles.successIcon} />
                    <span>Chi phí đã được phân bổ thành công vào giá trị nhập kho. Lô hàng đã hoàn tất!</span>
                  </div>
                )}
              </div>

              <div className={styles.entriesSection}>
                <h4 className={styles.entriesTitle}>Bảng Tiếp Nhận Hàng Hóa & Kiểm Định QA/QC</h4>
                
                {receiveError && <div className={styles.errorAlert}>{receiveError}</div>}

                {activeShipment.stock_entries_details && activeShipment.stock_entries_details.length > 0 ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Sản Phẩm</th>
                          <th>Phiếu Kho gốc</th>
                          <th style={{ width: '100px' }}>Số Lượng Đặt</th>
                          <th style={{ width: '120px' }}>Kết Quả QA/QC</th>
                          <th style={{ width: '130px' }}>Thao Tác QC</th>
                          <th>Kho Nhập hàng</th>
                          <th>Số Thực Nhận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeShipment.stock_entries_details.map((detail) => {
                          const local = localDetails[detail.id!] || { quantity: detail.quantity || 0, target_warehouse_id: detail.target_warehouse_id || null };
                          const isDraftShipment = activeShipment.status === 'draft';
                          const isArrivedShipment = activeShipment.status === 'arrived';
                          const isInspectedShipment = activeShipment.status === 'inspected';

                          return (
                            <tr key={detail.id}>
                              <td>
                                <div className={styles.itemMeta}>
                                  <span className={styles.itemCode}>{detail.item_code}</span>
                                  <span className={styles.itemName}>{detail.item_name}</span>
                                </div>
                              </td>
                              <td className={styles.entryName}>{detail.stock_entry_name}</td>
                              <td>{detail.quantity}</td>
                              <td>
                                {detail.qc_status === 'PASSED' ? (
                                  <Badge variant="success">PASSED (Đạt)</Badge>
                                ) : detail.qc_status === 'FAILED' ? (
                                  <div className={styles.qcBadge}>
                                    <Badge variant="error">FAILED (Lỗi)</Badge>
                                  </div>
                                ) : (
                                  <Badge variant="neutral">Chờ kiểm tra</Badge>
                                )}
                              </td>
                              <td>
                                {isArrivedShipment ? (
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setQcItem({
                                        id: detail.id!,
                                        item_id: detail.item_id!,
                                        item_code: detail.item_code!,
                                        item_name: detail.item_name!,
                                        stock_entry_id: detail.stock_entry_id!
                                      });
                                      setIsQcModalOpen(true);
                                    }}
                                  >
                                    Đánh giá QC
                                  </Button>
                                ) : isDraftShipment ? (
                                  <span className={styles.itemName}>Chờ hàng đến</span>
                                ) : (
                                  <span className={styles.itemName}>Đã khóa QC</span>
                                )}
                              </td>
                              <td>
                                {isInspectedShipment && detail.qc_status === 'PASSED' ? (
                                  <select 
                                    className={styles.selectWarehouse}
                                    value={local.target_warehouse_id || ''}
                                    onChange={(e) => handleLocalWarehouseChange(detail.id!, e.target.value)}
                                  >
                                    <option value="">-- Chọn Kho Đích --</option>
                                    {warehouses.map(w => (
                                      <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={styles.entryName}>
                                    {detail.target_warehouse_name || (detail.qc_status === 'FAILED' ? 'Bị loại bỏ (QC Hỏng)' : '---')}
                                  </span>
                                )}
                              </td>
                              <td>
                                {isInspectedShipment && detail.qc_status === 'PASSED' ? (
                                  <input 
                                    type="number"
                                    className={styles.inputNumber}
                                    min="0.01"
                                    step="0.01"
                                    value={local.quantity}
                                    onChange={(e) => handleLocalQuantityChange(detail.id!, e.target.value)}
                                  />
                                ) : (
                                  <span>
                                    {detail.qc_status === 'FAILED' ? 0 : detail.quantity}
                                  </span>
                                )}
                                {detail.qc_status === 'FAILED' && (
                                  <div className={styles.failedText}>
                                    <AlertTriangle size={11} />
                                    <span>Từ chối nhận</span>
                                  </div>
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

                {activeShipment.status === 'inspected' && activeShipment.stock_entries?.some(se => se.status === 'draft') && (
                  <div className={styles.actionRow}>
                    <Button 
                      variant="primary" 
                      onClick={handleConfirmReceiving}
                      loading={isReceiving}
                      icon={<Check size={16} />}
                    >
                      Xác nhận nhận hàng & Hoàn tất Lô hàng
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <Package size={48} className={styles.placeholderIcon} />
              <h3>Chọn một lô hàng để làm việc</h3>
              <p>Chọn một lô hàng từ danh sách bên trái để thực hiện quy trình kiểm định chất lượng QA/QC và thủ kho nhận hàng.</p>
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
            <h4 className={styles.selectEntriesTitle}>Chọn Phiếu Nhập Kho Nháp (GRN) Liên Kết</h4>
            <p className={styles.selectEntriesDesc}>Chọn các phiếu nhập kho đang chờ xử lý thuộc lô hàng vận chuyển này.</p>
            
            {availableStockEntries.length === 0 ? (
              <div className={styles.noEntriesAvailable}>Không có phiếu nhập kho nháp nào khả dụng.</div>
            ) : (
              <div className={styles.entriesSelectionList}>
                {availableStockEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`${styles.selectionItem} ${selectedStockEntryIds.includes(entry.id!) ? styles.selectedItem : ''}`}
                    onClick={() => toggleStockEntrySelection(entry.id!)}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedStockEntryIds.includes(entry.id!)}
                      onChange={() => {}}
                      className={styles.checkbox}
                    />
                    <div className={styles.selectionInfo}>
                      <span className={styles.selectionName}>{entry.name} (NCC: {entry.vendor_name || 'N/A'})</span>
                      <span className={styles.selectionDate}>
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        {entry.posting_date ? new Date(entry.posting_date).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                    <Badge variant="neutral">Bản nháp</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy bỏ</Button>
            <Button type="submit" variant="primary">Khởi tạo lô hàng</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Submit QA/QC Result */}
      <Modal
        open={isQcModalOpen}
        onClose={() => setIsQcModalOpen(false)}
        title={`Đánh Giá Chất Lượng: ${qcItem?.item_name || ''}`}
      >
        <form onSubmit={handleQcSubmit} className={styles.form}>
          {qcError && <div className={styles.errorAlert}>{qcError}</div>}
          
          <div className={styles.allocationSummary}>
            <Info size={16} className={styles.infoIcon} />
            <p>Mặt hàng: <strong>{qcItem?.item_code}</strong>. Liên kết phiếu kho: <strong>{qcItem?.stock_entry_id.substring(0,8)}...</strong></p>
          </div>

          <div className={styles.selectEntriesBox}>
            <label className={styles.selectEntriesTitle}>Kết Quả Kiểm Định</label>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="qc_result" 
                  value="PASSED"
                  checked={qcResult === 'PASSED'}
                  onChange={() => setQcResult('PASSED')}
                />
                <Badge variant="success">PASSED (Đạt chất lượng)</Badge>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="qc_result" 
                  value="FAILED"
                  checked={qcResult === 'FAILED'}
                  onChange={() => setQcResult('FAILED')}
                />
                <Badge variant="error">FAILED (Hỏng / Không đạt)</Badge>
              </label>
            </div>
          </div>

          <Input 
            label="Ghi chú đánh giá / Lý do (nếu hỏng)"
            placeholder="Nhập ghi chú chi tiết..."
            value={qcRemarks}
            onChange={(e) => setQcRemarks(e.target.value)}
          />

          <div className={styles.formFooter}>
            <Button type="button" variant="secondary" onClick={() => setIsQcModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu kết quả QC</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
