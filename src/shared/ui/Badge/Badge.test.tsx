import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders badge with correct children text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies neutral style by default', () => {
    render(<Badge>Default</Badge>);
    const badgeElement = screen.getByText('Default');
    expect(badgeElement.className).toContain('neutral');
  });

  it('applies accent style variant correctly', () => {
    render(<Badge variant="accent">Accent Variant</Badge>);
    const badgeElement = screen.getByText('Accent Variant');
    expect(badgeElement.className).toContain('accent');
  });

  it('applies success variant correctly', () => {
    render(<Badge variant="success">Success</Badge>);
    const badgeElement = screen.getByText('Success');
    expect(badgeElement.className).toContain('success');
  });
});
