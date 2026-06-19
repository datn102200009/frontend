import { render, screen } from '@testing-library/react';
import { TextArea } from './TextArea';
import { describe, it, expect } from 'vitest';

describe('TextArea', () => {
  it('renders textarea with label correctly', () => {
    render(<TextArea label="Comments" />);
    expect(screen.getByLabelText('Comments')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<TextArea label="Comments" error="Required comments" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required comments');
  });

  it('respects rows prop', () => {
    render(<TextArea label="Comments" rows={5} />);
    const textarea = screen.getByLabelText('Comments') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(5);
  });
});
