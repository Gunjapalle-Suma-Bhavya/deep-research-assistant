/**
 * Deep Research Assistant - Server-Sent Events (SSE) Stream Manager
 */

class ResearchStreamClient {
  constructor(taskId, callbacks = {}) {
    this.taskId = taskId;
    this.callbacks = callbacks;
    this.eventSource = null;
    this.isConnected = false;
  }

  connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    const streamUrl = `/api/research/stream/${this.taskId}`;
    this.eventSource = new EventSource(streamUrl);

    this.eventSource.onopen = () => {
      this.isConnected = true;
      if (this.callbacks.onOpen) this.callbacks.onOpen();
    };

    this.eventSource.onerror = (err) => {
      console.warn('[SSE] Stream error / reconnecting:', err);
      if (this.callbacks.onError) this.callbacks.onError(err);
    };

    // Generic message listener
    this.eventSource.onmessage = (e) => {
      this._handleEvent('message', e.data);
    };

    // Specific event listeners
    const eventTypes = [
      'ping',
      'node_transition',
      'waiting_for_clarification',
      'clarification_received',
      'brief_generating',
      'brief_ready',
      'supervisor_plan',
      'subagent_start',
      'subagent_complete',
      'completed',
      'failed',
      'cancelled',
    ];


    eventTypes.forEach((type) => {
      this.eventSource.addEventListener(type, (e) => {
        this._handleEvent(type, e.data);
      });
    });
  }

  _handleEvent(type, rawData) {
    if (type === 'ping') return;

    let parsed = null;
    try {
      parsed = JSON.parse(rawData);
    } catch (e) {
      parsed = { raw: rawData };
    }

    const payload = parsed.data || parsed;

    if (this.callbacks.onEvent) {
      this.callbacks.onEvent(type, payload, parsed);
    }

    if (this.callbacks[type]) {
      this.callbacks[type](payload, parsed);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }
}
