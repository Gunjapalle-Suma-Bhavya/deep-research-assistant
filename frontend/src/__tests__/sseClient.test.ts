import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearchStreamClient } from '../services/sseClient';

describe('ResearchStreamClient', () => {
  let mockEventSource: any;

  beforeEach(() => {
    mockEventSource = {
      addEventListener: vi.fn(),
      close: vi.fn(),
      onmessage: null,
      onerror: null,
    };

    (global as any).EventSource = vi.fn().mockImplementation(() => mockEventSource);
  });

  it('initializes EventSource with correct research stream URL', () => {
    const client = new ResearchStreamClient('test-task-123', {});
    client.connect();

    expect(global.EventSource).toHaveBeenCalledWith('/api/research/stream/test-task-123');
  });

  it('dispatches status_update events to handler', () => {
    const onStatusUpdate = vi.fn();
    const client = new ResearchStreamClient('test-task-123', { onStatusUpdate });
    client.connect();

    // Find the status_update listener
    const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
    const statusListener = addEventListenerCalls.find((call: any[]) => call[0] === 'status_update')?.[1];

    expect(statusListener).toBeDefined();

    statusListener({
      data: JSON.stringify({ status: 'researching', progress: 50, step: 'Searching web' }),
    });

    expect(onStatusUpdate).toHaveBeenCalledWith({
      status: 'researching',
      progress: 50,
      step: 'Searching web',
    });
  });

  it('closes EventSource cleanly on close()', () => {
    const onClose = vi.fn();
    const client = new ResearchStreamClient('test-task-123', { onClose });
    client.connect();
    client.close();

    expect(mockEventSource.close).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
