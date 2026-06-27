import { describe, it, expect } from 'vitest';
import { consumeSSE } from '../sseStream';

describe('sseStream consumer', () => {
  it('parses single event correctly', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: content_delta\ndata: {\"delta\": \"Hello\"}\n\n"));
        controller.close();
      }
    });

    const mockResponse = {
      body: mockStream
    } as unknown as Response;

    const generator = consumeSSE(mockResponse);
    const results = [];
    for await (const val of generator) {
      results.push(val);
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      event: 'content_delta',
      data: { delta: 'Hello' }
    });
  });

  it('handles multiple events in one chunk', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            "event: content_delta\ndata: {\"delta\": \"A\"}\n\nevent: content_delta\ndata: {\"delta\": \"B\"}\n\n"
          )
        );
        controller.close();
      }
    });

    const mockResponse = {
      body: mockStream
    } as unknown as Response;

    const generator = consumeSSE(mockResponse);
    const results = [];
    for await (const val of generator) {
      results.push(val);
    }

    expect(results).toHaveLength(2);
    expect(results[0].data.delta).toBe('A');
    expect(results[1].data.delta).toBe('B');
  });
});
