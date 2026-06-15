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
      original_value: '50000000.00',
      salvage_value: '5000000.00',
      depreciation_method: 'straight_line',
      useful_life_months: 24,
      remaining_life_months: 24,
      accumulated_depreciation: '0.00',
      department: 'Sản xuất',
      is_active: true,
      status: 'idle',
    },
    {
      id: 'fa-002',
      asset_code: 'MOLD-002',
      asset_name: 'Khuôn nhựa B',
      original_value: '80000000.00',
      salvage_value: '10000000.00',
      depreciation_method: 'unit_of_production',
      useful_life_months: null,
      remaining_life_months: null,
      designed_capacity: 10000,
      accumulated_depreciation: '10000000.00',
      department: 'Sản xuất B',
      is_active: true,
      status: 'idle',
    }
  ];

  const mockDepreciationLogs = [
    {
      id: 'log-001',
      asset: 'fa-002',
      asset_code: 'MOLD-002',
      asset_name: 'Khuôn nhựa B',
      period: '2026-05',
      depreciation_amount: '10000000.00',
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

  it('opens purchase asset modal, shows capacity validation for uop', async () => {
    let postPayload: any = null;

    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({ results: mockFixedAssets });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({ results: [] });
      }),
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([]);
      }),
      http.post('*/api/v1/finance/fixed-assets/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'fa-new', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<FixedAssetsPage />);
    const user = userEvent.setup();

    // Click Mua TSCĐ
    await user.click(screen.getByRole('button', { name: /Mua TSCĐ/i }));

    expect(await screen.findByRole('heading', { name: /Ghi Nhận Mua Tài Sản Cố Định/i })).toBeInTheDocument();

    const modal = screen.getByRole('dialog');

    // Fill fields
    await user.type(within(modal).getByLabelText(/Tên tài sản/i), 'Khuôn nhựa C');

    const originalValueInput = within(modal).getByLabelText(/Nguyên giá \(VND\)/i);
    await user.clear(originalValueInput);
    await user.type(originalValueInput, '60000000');

    const salvageValueInput = within(modal).getByLabelText(/Giá trị thanh lý ước tính \(VND\)/i);
    await user.clear(salvageValueInput);
    await user.type(salvageValueInput, '5000000');
    
    const usefulLifeInput = within(modal).getByLabelText(/Số tháng khấu hao hữu ích/i);
    await user.clear(usefulLifeInput);
    await user.type(usefulLifeInput, '20');

    // Select UOP method
    const methodSelect = within(modal).getByLabelText(/Phương pháp khấu hao/i);
    await user.selectOptions(methodSelect, 'unit_of_production');

    // Click Save without capacity -> fails/shows validation
    const saveBtn = within(modal).getByRole('button', { name: /Ghi nhận mua/i });
    await user.click(saveBtn);

    // Verify capacity validation error message is visible
    expect(await screen.findByText(/Công suất thiết kế bắt buộc cho UOP/i)).toBeInTheDocument();

    // Enter capacity
    const capacityInput = within(modal).getByLabelText(/Công suất thiết kế \(Tổng sản lượng\)/i);
    await user.type(capacityInput, '20000');

    // Enter vendor name
    await user.type(within(modal).getByLabelText(/Nhà cung cấp/i), 'Supplier C');

    // Save again
    await user.click(saveBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        asset_name: 'Khuôn nhựa C',
        original_value: '60000000',
        salvage_value: '5000000',
        depreciation_method: 'unit_of_production',
        useful_life_months: null,
        designed_capacity: 20000,
        purchase_date: new Date().toISOString().split('T')[0],
        vendor_name: 'Supplier C',
        payment_method: 'bank_transfer'
      });
      expect(screen.queryByRole('heading', { name: /Ghi Nhận Mua Tài Sản Cố Định/i })).not.toBeInTheDocument();
    });
  });

  it('applies shortAssetCode and displays correct action buttons based on status/value', async () => {
    const mockAssetsWithVariousStatuses = [
      {
        id: 'fa-pending-receive',
        asset_code: 'FA-11111111-2222-3333-4444-555555555555',
        asset_name: 'Khuôn nhựa Nhập khẩu',
        original_value: 120000000,
        salvage_value: 0,
        depreciation_method: 'straight_line',
        useful_life_months: 24,
        remaining_life_months: 24,
        accumulated_depreciation: 0,
        department: 'Sản xuất',
        is_active: true,
        status: 'pending_receive',
      },
      {
        id: 'fa-pending-dispose-positive',
        asset_code: 'MOLD-003',
        asset_name: 'Khuôn nhựa Thanh lý Giá trị lớn',
        original_value: 150000000,
        salvage_value: 0,
        depreciation_method: 'straight_line',
        useful_life_months: 24,
        remaining_life_months: 0,
        accumulated_depreciation: 150000000,
        department: 'Sản xuất',
        is_active: true,
        status: 'pending_dispose',
        disposal_value: 20000000,
      },
      {
        id: 'fa-pending-dispose-zero',
        asset_code: 'MOLD-004',
        asset_name: 'Khuôn nhựa Thanh lý Không đồng',
        original_value: 30000000,
        salvage_value: 0,
        depreciation_method: 'straight_line',
        useful_life_months: 24,
        remaining_life_months: 0,
        accumulated_depreciation: 30000000,
        department: 'Sản xuất',
        is_active: true,
        status: 'pending_dispose',
        disposal_value: 0,
      },
    ];

    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({
          count: mockAssetsWithVariousStatuses.length,
          total_pages: 1,
          current_page: 1,
          results: mockAssetsWithVariousStatuses,
        });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({ results: [] });
      })
    );

    renderWithProviders(<FixedAssetsPage />, {
      preloadedState: {
        auth: {
          user: {
            id: 'user-001',
            username: 'admin',
            email: 'admin@test.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            permissions: [
              'finance.approve_fixed_asset_purchase',
              'finance.approve_fixed_asset_dispose',
              'finance.update_fixed_asset',
            ],
          } as any,
          token: 'mock-token',
          isAuthenticated: true,
        },
      },
    });

    // 1. Check shortAssetCode truncation for UUID-like code
    // "FA-11111111-2222-3333-4444-555555555555" -> 8 characters: "FA-11111"
    expect(await screen.findByText('FA-11111')).toBeInTheDocument();
    expect(screen.queryByText('FA-11111111-2222-3333-4444-555555555555')).not.toBeInTheDocument();

    // User-typed code should be unchanged
    expect(screen.getByText('MOLD-003')).toBeInTheDocument();
    expect(screen.getByText('MOLD-004')).toBeInTheDocument();

    // 2. Check Action Buttons based on status & value
    // For pending_receive: no action buttons should be visible
    expect(screen.queryByTitle('Gửi duyệt mua')).not.toBeInTheDocument();

    // For pending_dispose with positive value: no action buttons should be visible
    const rowPositive = screen.getByText('Khuôn nhựa Thanh lý Giá trị lớn').closest('tr');
    expect(rowPositive).toBeInTheDocument();
    expect(within(rowPositive!).queryByTitle('Gửi duyệt thanh lý')).not.toBeInTheDocument();
    expect(within(rowPositive!).queryByTitle('Xác nhận thanh lý')).not.toBeInTheDocument();

    // For pending_dispose with zero value: no action buttons should be visible
    const rowZero = screen.getByText('Khuôn nhựa Thanh lý Không đồng').closest('tr');
    expect(rowZero).toBeInTheDocument();
    expect(within(rowZero!).queryByTitle('Xác nhận thanh lý')).not.toBeInTheDocument();
  });

  it('shows ConfirmModal in AssetDisposeModal and handles different disposal values and flows', async () => {
    let requestPayload: any = null;

    server.use(
      http.get('*/api/v1/finance/fixed-assets/', () => {
        return HttpResponse.json({ results: mockFixedAssets });
      }),
      http.get('*/api/v1/finance/fixed-assets/depreciation-logs/', () => {
        return HttpResponse.json({ results: [] });
      }),
      http.post('*/api/v1/finance/fixed-assets/fa-001/request-dispose/', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<FixedAssetsPage />, {
      preloadedState: {
        auth: {
          user: {
            id: 'user-001',
            username: 'admin',
            email: 'admin@test.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            permissions: [
              'finance.approve_fixed_asset_purchase',
              'finance.approve_fixed_asset_dispose',
              'finance.update_fixed_asset',
            ],
          } as any,
          token: 'mock-token',
          isAuthenticated: true,
        },
      },
    });
    const user = userEvent.setup();

    // Trigger Yêu cầu thanh lý on fa-001 (Khuôn nhựa A, status idle)
    const row = (await screen.findByText('Khuôn nhựa A')).closest('tr');
    expect(row).toBeInTheDocument();
    const disposeBtn = within(row!).getByTitle('Yêu cầu thanh lý');
    await user.click(disposeBtn);

    // AssetDisposeModal opens
    const disposeModal = await screen.findByRole('dialog', { name: /Yêu Cầu Thanh Lý Tài Sản Cố Định/i });
    expect(disposeModal).toBeInTheDocument();

    // Scenario 1: Zero value disposal warning
    const submitBtn = within(disposeModal).getByRole('button', { name: /Ghi nhận yêu cầu/i });
    await user.click(submitBtn);

    // ConfirmModal should open with zero value warning
    const confirmModal1 = await screen.findByRole('dialog', { name: /Xác nhận yêu cầu thanh lý tài sản/i });
    expect(confirmModal1).toBeInTheDocument();
    expect(within(confirmModal1).getByText(/Giá trị thu hồi bằng 0 — tài sản sẽ được thanh lý ngay khi bạn xác nhận/i)).toBeInTheDocument();

    // Click Hủy on ConfirmModal
    const cancelConfirmBtn = within(confirmModal1).getByRole('button', { name: /Hủy/i });
    await user.click(cancelConfirmBtn);
    
    // ConfirmModal closes but main modal remains
    expect(screen.queryByRole('dialog', { name: /Xác nhận yêu cầu thanh lý tài sản/i })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /Yêu Cầu Thanh Lý Tài Sản Cố Định/i })).toBeInTheDocument();

    // Scenario 2: Large value warning (> 100M VND)
    const valInput = within(disposeModal).getByLabelText(/Giá trị thu về dự kiến/i);
    await user.clear(valInput);
    await user.type(valInput, '150000000'); // 150M VND
    await user.click(submitBtn);

    // ConfirmModal opens with large value warning
    const confirmModal2 = await screen.findByRole('dialog', { name: /Xác nhận yêu cầu thanh lý tài sản/i });
    expect(confirmModal2).toBeInTheDocument();
    expect(within(confirmModal2).getByText(/Tài sản có giá trị lớn, vui lòng kiểm tra kỹ thông tin trước khi xác nhận/i)).toBeInTheDocument();

    // Click Xác nhận thanh lý
    const confirmBtn = within(confirmModal2).getByRole('button', { name: /Xác nhận thanh lý/i });
    await user.click(confirmBtn);

    // Verify request payload and modals closed
    await waitFor(() => {
      expect(requestPayload).toEqual({
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_value: '150000000',
        remarks: null
      });
      expect(screen.queryByRole('dialog', { name: /Yêu Cầu Thanh Lý Tài Sản Cố Định/i })).not.toBeInTheDocument();
    });
  });

});
