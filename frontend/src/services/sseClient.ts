/**
 * Resilient SSE client for real-time Deep Research event streaming
 */

export interface SSEEventHandlers {
  onStatusUpdate?: (data: { status: string; progress: number; step: string }) => void;
  onLog?: (log: any) => void;
  onBrief?: (brief: any) => void;
  onClarification?: (clarification: any) => void;
  onSubtopicUpdate?: (subtopic: any) => void;
  onSourceAdded?: (source: any) => void;
  onReportChunk?: (chunk: string) => void;
  onComplete?: (report: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export class ResearchStreamClient {
  private eventSource: EventSource | null = null;
  private isManuallyClosed = false;

  constructor(private taskId: string, private handlers: SSEEventHandlers) {}

  public connect(): void {
    this.isManuallyClosed = false;
    const url = `/api/research/stream/${this.taskId}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        if (!event.data || event.data === ': keep-alive') return;
        const payload = JSON.parse(event.data);
        this.dispatch(payload.event, payload.data);
      } catch (err) {
        // Raw event format
        console.warn('SSE Parse error or plain message:', event.data, err);
      }
    };

    // Generic listeners for named SSE events if server uses named events
    const eventTypes = [
      'status_update',
      'log',
      'brief_ready',
      'clarification_needed',
      'subtopic_update',
      'source_added',
      'report_chunk',
      'complete',
      'error',
    ];

    eventTypes.forEach((eventType) => {
      this.eventSource?.addEventListener(eventType, (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          this.dispatch(eventType, parsed);
        } catch (e) {
          this.dispatch(eventType, event.data);
        }
      });
    });

    this.eventSource.onerror = (err) => {
      if (this.isManuallyClosed) return;
      console.error('SSE Stream encountered an error:', err);
      if (this.handlers.onError) {
        this.handlers.onError('Connection to research event stream was interrupted.');
      }
      this.close();
    };
  }

  private dispatch(eventName: string, data: any): void {
    switch (eventName) {
      case 'status':
      case 'status_update':
        this.handlers.onStatusUpdate?.(data);
        break;
      case 'log':
        this.handlers.onLog?.(data);
        break;
      case 'brief':
      case 'brief_ready':
        this.handlers.onBrief?.(data);
        break;
      case 'clarification':
      case 'clarification_needed':
        this.handlers.onClarification?.(data);
        break;
      case 'subtopic':
      case 'subtopic_update':
        this.handlers.onSubtopicUpdate?.(data);
        break;
      case 'source':
      case 'source_added':
        this.handlers.onSourceAdded?.(data);
        break;
      case 'report_chunk':
        this.handlers.onReportChunk?.(typeof data === 'string' ? data : data?.chunk || '');
        break;
      case 'complete':
        this.handlers.onComplete?.(data);
        this.close();
        break;
      case 'error':
        this.handlers.onError?.(typeof data === 'string' ? data : data?.message || 'Unknown error');
        this.close();
        break;
      default:
        break;
    }
  }

  public close(): void {
    this.isManuallyClosed = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.handlers.onClose?.();
  }
}
