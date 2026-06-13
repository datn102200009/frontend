import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { KpiCard } from '../KpiCard';

describe('KpiCard', () => {
  it('renders hrm_expiring_contracts with list of employees when top_items is provided', () => {
    const mockData = {
      expiring_count: 3,
      critical_count: 1,
      top_items: [
        { id: '1', employee_name: 'Nguyễn Văn A', days_left: 5 },
        { id: '2', employee_name: 'Trần Thị B', days_left: 0 },
        { id: '3', employee_name: 'Lê Văn C', days_left: -2 }
      ]
    };

    renderWithProviders(
      <KpiCard
        title="Hợp đồng lao động sắp hết hạn"
        code="hrm_expiring_contracts"
        data={mockData}
      />
    );

    // Nguyễn Văn A -> Còn 5 ngày
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Còn 5 ngày')).toBeInTheDocument();

    // Trần Thị B -> Hết hạn hôm nay
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('Hết hạn hôm nay')).toBeInTheDocument();

    // Lê Văn C -> Đã quá hạn 2 ngày
    expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
    expect(screen.getByText('Đã quá hạn 2 ngày')).toBeInTheDocument();
  });

  it('renders hrm_expiring_contracts cleanly when top_items is empty', () => {
    const mockData = {
      expiring_count: 0,
      critical_count: 0,
      top_items: []
    };

    renderWithProviders(
      <KpiCard
        title="Hợp đồng lao động sắp hết hạn"
        code="hrm_expiring_contracts"
        data={mockData}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn A')).not.toBeInTheDocument();
  });

  it('handles invalid top_items array gracefully by falling back to empty list', () => {
    const mockData = {
      expiring_count: 1,
      critical_count: 0,
      top_items: {} as any // invalid format
    };

    renderWithProviders(
      <KpiCard
        title="Hợp đồng lao động sắp hết hạn"
        code="hrm_expiring_contracts"
        data={mockData}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
