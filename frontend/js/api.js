/**
 * Deep Research Assistant - Backend API Client
 */

const API = {
  baseUrl: '',

  async startResearch(query, depth = 'in-depth', customInstructions = '') {
    const resp = await fetch(`${this.baseUrl}/api/research/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        depth,
        custom_instructions: customInstructions || null,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to start research' }));
      throw new Error(err.detail || 'Failed to start research');
    }
    return await resp.json();
  },

  async submitClarification(taskId, responses, additionalNotes = '') {
    const resp = await fetch(`${this.baseUrl}/api/research/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        responses,
        additional_notes: additionalNotes || null,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to submit clarification' }));
      throw new Error(err.detail || 'Failed to submit clarification');
    }
    return await resp.json();
  },

  async getTaskStatus(taskId) {
    const resp = await fetch(`${this.baseUrl}/api/research/status/${taskId}`);
    if (!resp.ok) {
      throw new Error(`Failed to fetch status for task ${taskId}`);
    }
    return await resp.json();
  },

  async getHistory() {
    const resp = await fetch(`${this.baseUrl}/api/research/history`);
    if (!resp.ok) return [];
    return await resp.json();
  },

  async deleteTask(taskId) {
    const resp = await fetch(`${this.baseUrl}/api/research/${taskId}`, {
      method: 'DELETE',
    });
    return resp.ok;
  },

  async cancelTask(taskId) {
    const resp = await fetch(`${this.baseUrl}/api/research/${taskId}/cancel`, {
      method: 'POST',
    });
    return resp.ok;
  },

  async clearHistory() {
    const resp = await fetch(`${this.baseUrl}/api/research/history/clear`, {
      method: 'DELETE',
    });
    return await resp.json();
  },

  async getConfig() {
    const resp = await fetch(`${this.baseUrl}/api/config`);
    if (!resp.ok) {
      throw new Error('Failed to load system configuration');
    }
    return await resp.json();
  },

  async updateConfig(configData) {
    const resp = await fetch(`${this.baseUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to update configuration' }));
      throw new Error(err.detail || 'Failed to update configuration');
    }
    return await resp.json();
  },

  async testConnection(testData) {
    const resp = await fetch(`${this.baseUrl}/api/config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Connection test failed' }));
      throw new Error(err.detail || 'Connection test failed');
    }
    return await resp.json();
  },

  getExportUrl(taskId, format) {
    return `${this.baseUrl}/api/research/${taskId}/export/${format}`;
  },
};

