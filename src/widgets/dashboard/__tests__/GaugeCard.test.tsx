import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { GaugeCard } from '../GaugeCard';

describe('GaugeCard', () => {
  const mockData = {
    present_count: 8,
    total_active_employees: 10,
    absent_count: 2
  };

  it('renders only absent count text', () => {
    renderWithProviders(
      <GaugeCard
        title="Tỷ lệ đi làm hôm nay"
        code="hrm_today_attendance_rate"
        data={mockData}
      />
    );

    expect(screen.getByText('2 người vắng')).toBeInTheDocument();
    expect(screen.queryByText(/Đi làm:/)).not.toBeInTheDocument();
  });
});
