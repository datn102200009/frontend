import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';
import { describe, it, expect, vi } from 'vitest';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and content when open is true', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies zIndex style correctly', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal" zIndex={1100}>
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.zIndex).toBe('1100');
  });

  it('applies nested class and sets aria-modal="false" when nested is true', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal" nested={true}>
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('nested-modal-backdrop');
    expect(dialog.getAttribute('aria-modal')).toBe('false');
  });
});
