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

    const parseAndDispatch = (eventType: string, rawData: any) => {
      try {
        if (!rawData || rawData === ': keep-alive') return;
        
        let payload: any = rawData;
        if (typeof rawData === 'string') {
          // If rawData accidentally contains 'data: {...}' or 'event: ...'
          let cleaned = rawData.trim();
          if (cleaned.startsWith('data:')) {
            cleaned = cleaned.replace(/^data:\s*/, '');
          }
          try {
            payload = JSON.parse(cleaned);
          } catch {
            payload = cleaned;
          }
        }

        // Extract event name and data object
        const resolvedEvent = payload?.event || eventType;
        const resolvedData = payload?.data !== undefined ? payload.data : payload;

        this.dispatch(resolvedEvent, resolvedData);
      } catch (err) {
        console.warn('SSE Parse error or unhandled message:', rawData, err);
      }
    };

    this.eventSource.onmessage = (event) => {
      parseAndDispatch('message', event.data);
    };

    // Generic listeners for named SSE events from backend
    const eventTypes = [
      'ping',
      'node_transition',
      'waiting_for_clarification',
      'clarification_needed',
      'clarification_received',
      'brief_generating',
      'brief_ready',
      'supervisor_plan',
      'subagent_start',
      'subagent_complete',
      'status',
      'status_update',
      'log',
      'subtopic_update',
      'source_added',
      'report_chunk',
      'completed',
      'complete',
      'failed',
      'error',
    ];

    eventTypes.forEach((eventType) => {
      this.eventSource?.addEventListener(eventType, (event: any) => {
        parseAndDispatch(eventType, event.data);
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
      case 'node_transition':
        this.handlers.onStatusUpdate?.({
          status: data?.node || 'researching',
          progress: data?.progress || 30,
          step: data?.message || 'Processing stage transition...',
        });
        if (data?.message) {
          this.handlers.onLog?.({
            id: String(Date.now()),
            timestamp: new Date().toISOString(),
            agent: 'system',
            level: 'info',
            message: data.message,
          });
        }
        break;
      case 'log':
        this.handlers.onLog?.(data);
        break;
      case 'brief':
      case 'brief_ready':
        this.handlers.onBrief?.(data?.brief || data);
        break;
      case 'clarification':
      case 'clarification_needed':
      case 'waiting_for_clarification':
        this.handlers.onClarification?.({
          reason: data?.reasoning || data?.reason || '',
          questions: data?.questions || [],
        });
        break;
      case 'subtopic':
      case 'subtopic_update':
        this.handlers.onSubtopicUpdate?.(data);
        break;
      case 'subagent_start':
        this.handlers.onLog?.({
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          agent: 'researcher',
          level: 'search',
          message: data?.message || `Starting subtopic: ${data?.topic}`,
        });
        break;
      case 'subagent_complete':
        this.handlers.onLog?.({
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          agent: 'researcher',
          level: 'success',
          message: data?.message || `Completed subtopic: ${data?.topic}`,
        });
        break;
      case 'source':
      case 'source_added':
        this.handlers.onSourceAdded?.(data);
        break;
      case 'report_chunk':
        this.handlers.onReportChunk?.(typeof data === 'string' ? data : data?.chunk || '');
        break;
      case 'completed':
      case 'complete':
        this.handlers.onComplete?.(data?.report || data);
        this.close();
        break;
      case 'failed':
      case 'error':
        this.handlers.onError?.(typeof data === 'string' ? data : data?.error || data?.message || 'Unknown error');
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
