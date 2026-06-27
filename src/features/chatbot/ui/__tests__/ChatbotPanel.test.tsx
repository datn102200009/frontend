import { screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { ChatbotPanel } from '../ChatbotPanel';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('ChatbotPanel component', () => {
  it('does not render when user lacks permission', () => {
    const { container } = renderWithProviders(
      <ChatbotPanel open={true} />,
      {
        preloadedState: {
          auth: {
            user: { username: 'test_user', permissions: [] } as any,
            token: null,
            isAuthenticated: false,
          },
        },
      }
    );
    expect(container.querySelector('aside')).toBeNull();
  });

  it('renders panel when user has permission', () => {
    renderWithProviders(
      <ChatbotPanel open={true} />,
      {
        preloadedState: {
          auth: {
            user: { username: 'test_user', permissions: ['common.use_chatbot'] } as any,
            token: 'mock-token',
            isAuthenticated: true,
          },
        },
      }
    );
    expect(screen.getByText('Trợ lý AI')).toBeInTheDocument();
  });
});
