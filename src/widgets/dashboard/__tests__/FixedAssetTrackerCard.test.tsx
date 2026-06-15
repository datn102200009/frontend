import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { FixedAssetTrackerCard } from '../FixedAssetTrackerCard';

describe('FixedAssetTrackerCard', () => {
  const mockData = {
    items: [
      {
        id: 'asset-1',
        asset_code: 'AST-001',
        asset_name: 'Máy ép nhựa 01',
        depreciation_method: 'straight_line' as const,
        original_value: '100000000',
        salvage_value: '10000000',
        accumulated_depreciation: '30000000',
        remaining_value: '60000000',
        status: 'active' as const,
        alerts: [
          {
            category: 'near_end' as const,
            level: 'warning' as const,
            reason: 'Còn 2 tháng là hết hạn sử dụng.',
          },
        ],
      },
      {
        id: 'asset-2',
        asset_code: 'AST-002',
        asset_name: 'Khuôn dập cốc',
        depreciation_method: 'unit_of_production' as const,
        original_value: '50000000',
        salvage_value: '0',
        accumulated_depreciation: '50000000',
        remaining_value: '0',
        status: 'active' as const,
        alerts: [
          {
            category: 'fully_depreciated' as const,
            level: 'critical' as const,
            reason: 'Tài sản đã khấu hao hết giá trị.',
          },
        ],
      },
    ],
    total_count: 2,
    current_period: '2026-06',
    is_done: false,
    depreciated_assets_count: 1,
    pending_assets_count: 1,
  };

  it('renders correctly and shows default selected asset values', () => {
    renderWithProviders(
      <FixedAssetTrackerCard
        title="Theo dõi khấu hao"
        code="finance_depreciation_status"
        data={mockData}
      />
    );

    expect(screen.getByText('Theo dõi khấu hao')).toBeInTheDocument();
    expect(screen.getByText('Nguyên giá')).toBeInTheDocument();
    expect(screen.getByText('100.000.000')).toBeInTheDocument();
    
    expect(screen.getByText(/Lũy kế khấu hao/)).toBeInTheDocument();
    expect(screen.getByText(/30\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Giá trị còn lại/)).toBeInTheDocument();
    expect(screen.getByText(/60\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Giá trị thanh lý/)).toBeInTheDocument();
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument();

    expect(screen.getByText('Còn 2 tháng là hết hạn sử dụng.')).toBeInTheDocument();
  });

  it('updates donut when asset changes', async () => {
    renderWithProviders(
      <FixedAssetTrackerCard
        title="Theo dõi khấu hao"
        code="finance_depreciation_status"
        data={mockData}
      />
    );
    const user = userEvent.setup();

    const select = screen.getByRole('combobox', { name: 'Chọn tài sản theo dõi' });
    await user.click(select);

    const option2 = screen.getByRole('option', { name: 'AST-002 - Khuôn dập cốc' });
    await user.click(option2);

    expect(screen.getByText('50.000.000')).toBeInTheDocument();
    expect(screen.getByText('Tài sản đã khấu hao hết giá trị.')).toBeInTheDocument();
  });
});
