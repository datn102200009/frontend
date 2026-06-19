import { useMemo } from 'react';
import { useGetHrmSalaryPeriodsQuery } from '@entities/hrm/api/hrmApi';

interface UseSalaryPeriodsProps {
  selectedPeriod?: string;
}

export function useSalaryPeriods({ selectedPeriod }: UseSalaryPeriodsProps = {}) {
  const { data: periods = [], isLoading, error } = useGetHrmSalaryPeriodsQuery();

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    periods.forEach((p) => {
      const parts = p.split('-');
      if (parts[1]) {
        months.add(parts[1]);
      }
    });

    // If a selected period is provided, ensure its month is in the options to prevent select value mismatch
    if (selectedPeriod) {
      const parts = selectedPeriod.split('-');
      if (parts[1]) {
        months.add(parts[1]);
      }
    }

    return Array.from(months).sort();
  }, [periods, selectedPeriod]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    periods.forEach((p) => {
      const parts = p.split('-');
      if (parts[0]) {
        years.add(parts[0]);
      }
    });

    // If a selected period is provided, ensure its year is in the options to prevent select value mismatch
    if (selectedPeriod) {
      const parts = selectedPeriod.split('-');
      if (parts[0]) {
        years.add(parts[0]);
      }
    }

    return Array.from(years).sort().reverse();
  }, [periods, selectedPeriod]);

  return {
    periods,
    monthOptions,
    yearOptions,
    isLoading,
    error,
  };
}
