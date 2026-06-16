import React, { useState, useEffect } from 'react';
import { usePostHrmEmployeesByIdAdjustSalaryMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { AdjustSalaryFormModal } from './AdjustSalaryFormModal';
import { AdjustSalaryConfirmModal } from './AdjustSalaryConfirmModal';

interface AdjustSalaryFlowProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
}

type Step = 'form' | 'confirm';

export const AdjustSalaryFlow: React.FC<AdjustSalaryFlowProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
}) => {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<{ new_salary_base: number; reason: string } | null>(null);
  const [adjustSalary] = usePostHrmEmployeesByIdAdjustSalaryMutation();

  useEffect(() => {
    if (open) {
      setStep('form');
      setFormData(null);
    }
  }, [open]);

  const handleContinue = (data: { new_salary_base: number; reason: string }) => {
    setFormData(data);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!formData || !employee.id) return;
    try {
      await adjustSalary({
        id: employee.id,
        body: {
          new_salary_base: formData.new_salary_base,
          reason: formData.reason || undefined,
        },
      }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to adjust salary', err);
      const apiErr = err as { data?: { error?: string; detail?: string } };
      const message =
        apiErr?.data?.error ||
        apiErr?.data?.detail ||
        'Có lỗi xảy ra khi thực hiện cập nhật. Vui lòng kiểm tra lại.';
      throw new Error(message);
    }
  };

  return (
    <>
      <AdjustSalaryFormModal
        open={open && step === 'form'}
        employee={employee}
        onClose={onClose}
        onContinue={handleContinue}
      />
      {formData && (
        <AdjustSalaryConfirmModal
          open={open && step === 'confirm'}
          employee={employee}
          formData={formData}
          onClose={onClose}
          onBack={() => setStep('form')}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};
