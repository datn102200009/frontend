import '@testing-library/jest-dom';
import { server } from './shared/lib/test/server';

// Mock dialog element for jsdom
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function mock(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function mock(this: HTMLDialogElement) {
    this.open = false;
  });
});

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
