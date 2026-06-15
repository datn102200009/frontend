import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WorkOrderFixedAssetsSection } from './WorkOrderFixedAssetsSection';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('WorkOrderFixedAssetsSection', () => {
  const defaultProps = {
    value: [] as string[],
    onChange: vi.fn(),
    isReadOnly: false,
  };

  it('renders title and empty state when no assets are selected', async () => {
    renderWithProviders(<WorkOrderFixedAssetsSection {...defaultProps} />);
    expect(await screen.findByText('Tài sản cố định sử dụng (UOP)')).toBeInTheDocument();
    expect(screen.getByText('Chưa có tài sản cố định nào được chọn cho lệnh sản xuất này.')).toBeInTheDocument();
  });

  it('renders selected assets correctly', async () => {
    const props = {
      ...defaultProps,
      value: ['asset-1'],
    };
    renderWithProviders(<WorkOrderFixedAssetsSection {...props} />);
    expect(await screen.findByText('Khuôn mẫu 01')).toBeInTheDocument();
    expect(screen.getByText('Mã: MOLD-001')).toBeInTheDocument();
    expect(screen.queryByText('Chưa có tài sản cố định nào được chọn')).not.toBeInTheDocument();
  });

  it('calls onChange with new asset when adding', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WorkOrderFixedAssetsSection {...defaultProps} />);
    
    const select = await screen.findByRole('combobox');
    await user.click(select);
    
    const option = await screen.findByText('MOLD-001 - Khuôn mẫu 01');
    await user.click(option);

    const addButton = screen.getByRole('button', { name: 'Thêm' });
    await user.click(addButton);

    expect(defaultProps.onChange).toHaveBeenCalledWith(['asset-1']);
  });

  it('calls onChange when removing an asset', async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      value: ['asset-1'],
    };
    renderWithProviders(<WorkOrderFixedAssetsSection {...props} />);
    
    expect(await screen.findByText('Khuôn mẫu 01')).toBeInTheDocument();
    
    const removeBtn = screen.getByRole('button', { name: '' });
    await user.click(removeBtn);
    
    expect(defaultProps.onChange).toHaveBeenCalledWith([]);
  });
});
