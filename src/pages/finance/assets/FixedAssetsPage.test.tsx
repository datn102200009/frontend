/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FixedAssetsPage } from './FixedAssetsPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('FixedAssetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFixedAssets = [
    {
      id: 'fa-001',
      asset_code: 'MOLD-001',
      asset_name: 'Khuôn nhựa A',
      original_value: 50000000,
      salvage_value: 5000000,
      depreciation_method: 'straight_line',
      useful_life_months: 24,
      remaining_life_months: 24,
      accumulated_depreciation: 0,
      department: 'Sản xuất',
      is_active: true,
    },
    {
      id: 'fa-002',
      asset_code: 'MOLD-002',
      asset_name: 'Khuôn nhựa B',
      original_value: 80000000,
      salvage_value: 10000000,
      depreciation_method: 'unit_of_production',
      useful_life_months: 36,
      remaining_life_months: 36,
      designed_capacity: 10000,
      accumulated_depreciation: 10000000,
      department: 'Sản xuất B',
      is_active: true,
    }
  ];

  const mockDepreciationLogs = [
    {
      id: 'log-001',
      asset: 'fa-002',
      asset_code: 'MOLD-002',
      asset_name: 'Khuôn nhựa B',
      period: '2026-05',
      depreciation_amount: 10000000,
      remarks: 'Khấu hao sản lượng kì 2026-05',
      created_at: '2026-05-31T23:59:59Z',
    }
  ];

  it('renders FixedAssetsPage and loads fixed assets list', async () => {
    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({
          count: 2,
          total_pages: 1,
          current_page: 1,
          results: mockFixedAssets
        });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({
          count: 0,
          total_pages: 0,
          current_page: 1,
          results: []
        });
      })
    );

    renderWithProviders(<FixedAssetsPage />);

    // Table title should be present
    expect(screen.getByRole('heading', { name: /Tài Sản Cố Định/i })).toBeInTheDocument();

    // Verify loaded assets in table
    expect(await screen.findByText('MOLD-001')).toBeInTheDocument();
    expect(screen.getByText('Khuôn nhựa A')).toBeInTheDocument();
    expect(screen.getByText('MOLD-002')).toBeInTheDocument();
    expect(screen.getByText('Khuôn nhựa B')).toBeInTheDocument();
  });

  it('switches to Depreciation Logs tab and loads logs', async () => {
    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({ results: mockFixedAssets });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({
          count: 1,
          total_pages: 1,
          current_page: 1,
          results: mockDepreciationLogs
        });
      })
    );

    renderWithProviders(<FixedAssetsPage />);
    const user = userEvent.setup();

    // Switch to Logs Tab
    await user.click(screen.getByRole('tab', { name: /Lịch Sử Khấu Hao/i }));

    expect(screen.getByRole('heading', { name: /Lịch Sử Trích Khấu Hao/i })).toBeInTheDocument();

    // Check if log is displayed
    expect(await screen.findByText('Khấu hao sản lượng kì 2026-05')).toBeInTheDocument();
    expect(screen.getByText('MOLD-002')).toBeInTheDocument();
  });

  it('opens depreciation run modal and runs successfully', async () => {
    let postPayload: any = null;

    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({ results: mockFixedAssets });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({ results: [] });
      }),
      http.post('*/api/v1/finance/fixed-assets/depreciation/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json([{ id: 'log-new', asset: 'fa-001', period: postPayload.period, depreciation_amount: 1875000 }], { status: 201 });
      })
    );

    renderWithProviders(<FixedAssetsPage />);
    const user = userEvent.setup();

    // Click Run Depreciation
    await user.click(screen.getByRole('button', { name: /Trích Khấu Hao Tháng/i }));

    expect(await screen.findByRole('heading', { name: /Trích Khấu Hao Tài Sản/i })).toBeInTheDocument();

    const modal = screen.getByRole('dialog');
    const monthSelect = within(modal).getByLabelText(/^Tháng/i);
    const yearSelect = within(modal).getByLabelText(/^Năm/i);
    await user.selectOptions(monthSelect, '06');
    await user.selectOptions(yearSelect, '2026');

    // Submit
    const submitBtn = within(modal).getByRole('button', { name: /Thực hiện/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        period: '2026-06'
      });
      expect(screen.queryByRole('heading', { name: /Trích Khấu Hao Tài Sản/i })).not.toBeInTheDocument();
    });
  });

  it('opens create asset modal, shows capacity validation for uop', async () => {
    let postPayload: any = null;

    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({ results: mockFixedAssets });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({ results: [] });
      }),
      http.post('*/api/v1/finance/fixed-assets/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'fa-new', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<FixedAssetsPage />);
    const user = userEvent.setup();

    // Click Add Asset
    await user.click(screen.getByRole('button', { name: /Thêm Tài Sản/i }));

    expect(await screen.findByRole('heading', { name: /Thêm Tài Sản Cố Định Mới/i })).toBeInTheDocument();

    const modal = screen.getByRole('dialog');

    // Fill fields
    await user.type(within(modal).getByLabelText(/Mã tài sản/i), 'MOLD-003');
    await user.type(within(modal).getByLabelText(/Tên tài sản/i), 'Khuôn nhựa C');

    const originalValueInput = within(modal).getByLabelText(/Nguyên giá/i);
    await user.clear(originalValueInput);
    await user.type(originalValueInput, '60000000');

    const salvageValueInput = within(modal).getByLabelText(/Giá trị thanh lý/i);
    await user.clear(salvageValueInput);
    await user.type(salvageValueInput, '5000000');
    
    const usefulLifeInput = within(modal).getByLabelText(/Số tháng khấu hao/i);
    await user.clear(usefulLifeInput);
    await user.type(usefulLifeInput, '20');
    
    await user.type(within(modal).getByLabelText(/Phòng ban sử dụng/i), 'Xưởng C');

    // Select UOP method
    const methodSelect = within(modal).getByLabelText(/Phương pháp khấu hao/i);
    await user.selectOptions(methodSelect, 'unit_of_production');

    // Capacity is now shown. Click save without capacity -> fails/shows validation
    const saveBtn = within(modal).getByRole('button', { name: /Lưu/i });
    await user.click(saveBtn);

    // Verify capacity validation error message is visible
    expect(await screen.findByText(/Công suất thiết kế bắt buộc cho phương pháp sản lượng/i)).toBeInTheDocument();

    // Enter capacity
    const capacityInput = within(modal).getByLabelText(/Công suất thiết kế/i);
    await user.type(capacityInput, '20000');

    // Save again
    await user.click(saveBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        asset_code: 'MOLD-003',
        asset_name: 'Khuôn nhựa C',
        original_value: '60000000',
        salvage_value: '5000000',
        depreciation_method: 'unit_of_production',
        useful_life_months: 20,
        designed_capacity: 20000,
        department: 'Xưởng C'
      });
      expect(screen.queryByRole('heading', { name: /Thêm Tài Sản Cố Định Mới/i })).not.toBeInTheDocument();
    });
  });
});
