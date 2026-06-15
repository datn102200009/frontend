import { screen } from '@testing-library/react';
import EmployeesPage from './EmployeesPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and lists employees', async () => {
    server.use(
      http.get('*/api/v1/hrm/employees/', () => {
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 'emp-1',
              employee_id: 'NV001',
              full_name: 'Nguyễn Văn A',
              department: 'IT',
              position_title: 'Developer',
              salary_base: '10000000',
              employment_status: 'active'
            }
          ]
        });
      })
    );

    renderWithProviders(<EmployeesPage />);

    // Title should be present
    expect(screen.getByRole('heading', { name: 'Hồ Sơ Nhân Sự' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm Nhân Viên' })).toBeInTheDocument();

    // Nguyễn Văn A should render
    expect(await screen.findByText('Nguyễn Văn A')).toBeInTheDocument();
  });

  it('automatically opens employee details modal when id is in URL query params', async () => {
    server.use(
      http.get('*/api/v1/hrm/employees/', () => {
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 'emp-1',
              employee_id: 'NV001',
              full_name: 'Nguyễn Văn A',
              department: 'IT',
              position_title: 'Developer',
              salary_base: '10000000',
              employment_status: 'active'
            }
          ]
        });
      }),
      http.get('*/api/v1/hrm/employees/emp-1/', () => {
        return HttpResponse.json({
          id: 'emp-1',
          employee_id: 'NV001',
          full_name: 'Nguyễn Văn A',
          department: 'IT',
          position_title: 'Developer',
          salary_base: '10000000',
          employment_status: 'active',
          contracts: [],
          employment_histories: [],
          documents: [],
          rewards: [],
          disciplines: []
        });
      })
    );

    renderWithProviders(<EmployeesPage />, {
      initialEntries: ['/hrm/employees?tab=employees&id=emp-1']
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Hồ Sơ Nhân Sự Chi Tiết/i)).toBeInTheDocument();
  });
});
