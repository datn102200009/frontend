import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RewardDisciplineTable } from './RewardDisciplineTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('RewardDisciplineTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Reward list by default with action buttons', async () => {
    renderWithProviders(<RewardDisciplineTable />);

    expect(screen.getByText('Danh sách Khen Thưởng')).toBeInTheDocument();
    expect(screen.getByText('Danh sách Kỷ Luật')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ghi Nhận Thưởng' })).toBeInTheDocument();
  });

  it('switches tabs and opens modals', async () => {
    renderWithProviders(<RewardDisciplineTable />);
    const user = userEvent.setup();

    // Click "Danh sách Kỷ Luật" tab
    const disciplineTabButton = screen.getByText('Danh sách Kỷ Luật');
    await user.click(disciplineTabButton);

    // Confirm that the correct button is rendered
    expect(screen.getByRole('button', { name: 'Ghi Nhận Kỷ Luật' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ghi Nhận Thưởng' })).not.toBeInTheDocument();

    // Click "Ghi Nhận Kỷ Luật"
    const recordDisciplineButton = screen.getByRole('button', { name: 'Ghi Nhận Kỷ Luật' });
    await user.click(recordDisciplineButton);

    // Modal title should be shown
    expect(await screen.findByRole('heading', { name: 'Ghi Nhận Kỷ Luật' })).toBeInTheDocument();
  });
});
