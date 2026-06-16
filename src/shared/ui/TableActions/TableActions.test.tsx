import { render, screen } from '@testing-library/react';
import { ActionButton } from './TableActions';

// Mock Tooltip component to avoid testing react-tooltip details
vi.mock('../Tooltip/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ActionButton', () => {
  it('renders default variant', () => {
    render(<ActionButton icon={<span>icon</span>} variant="default" title="Action" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Default class is always present. For default variant, no additional modifier classes are added.
    expect(button.className).toContain('actionBtn');
    expect(button.className).not.toContain('deleteBtn');
    expect(button.className).not.toContain('successBtn');
    expect(button.className).not.toContain('infoBtn');
    expect(button.className).not.toContain('warningBtn');
  });

  it('renders danger variant', () => {
    render(<ActionButton icon={<span>icon</span>} variant="danger" title="Delete" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('deleteBtn');
  });

  it('renders success variant', () => {
    render(<ActionButton icon={<span>icon</span>} variant="success" title="Success" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('successBtn');
  });

  it('renders info variant', () => {
    render(<ActionButton icon={<span>icon</span>} variant="info" title="Info" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('infoBtn');
  });

  it('renders warning variant', () => {
    render(<ActionButton icon={<span>icon</span>} variant="warning" title="Warning" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('warningBtn');
  });
});
