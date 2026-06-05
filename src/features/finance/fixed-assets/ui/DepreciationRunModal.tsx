import { useState, useEffect, useMemo } from 'react';
import { Button } from '@shared/ui/Button/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import { useToast } from '@shared/ui/Toast/Toast';
import { ChevronDown } from 'lucide-react';
import { usePostFinanceFixedAssetsDepreciationMutation } from '@entities/finance/api/financeApi';

interface DepreciationRunModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (count: number, period: string) => void;
}

export function DepreciationRunModal({ open, onClose, onSuccess }: DepreciationRunModalProps) {
  const { toast } = useToast();
  const [runDepreciation, { isLoading: isRunning }] = usePostFinanceFixedAssetsDepreciationMutation();

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
    if (open) {
      const t = new Date();
      setRunMonth(String(t.getMonth() + 1).padStart(2, '0'));
      setRunYear(String(t.getFullYear()));
    }
  }, [open]);

  const handleRun = async () => {
    if (!runPeriod) {
      toast('error', 'Vui lòng chọn kỳ trích khấu hao');
      return;
    }
    try {
      const result = await runDepreciation({
        runDepreciationInput: { period: runPeriod },
      }).unwrap();
      onSuccess(result.length, runPeriod);
    } catch (error: any) {
      toast('error', error?.data?.error || error?.data?.detail || 'Lỗi khi chạy khấu hao');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Trích Khấu Hao Tài Sản"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isRunning}>
            Hủy
          </Button>
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? 'Đang xử lý...' : 'Thực hiện'}
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
  );
}
