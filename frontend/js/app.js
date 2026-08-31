/**
 * Deep Research Assistant - Main Frontend Application Logic
 */

class DeepResearchApp {
  constructor() {
    this.currentTaskId = null;
    this.streamClient = null;
    this.currentReport = null;
    this.currentTaskData = null;
    this.logEntriesCount = 0;
    this.rawLogs = [];
    this.activeLogFilter = 'all';
    this.autoScrollEnabled = true;
    this.systemConfig = null;

    this.initElements();
    this.bindEvents();
    this.loadConfig();
    this.loadHistoryCount();
  }

  initElements() {
    // Views
    this.inputSection = document.getElementById('inputSection');
    this.progressSection = document.getElementById('progressSection');
    this.reportSection = document.getElementById('reportSection');

    // Input form
    this.researchForm = document.getElementById('researchForm');
    this.researchQuery = document.getElementById('researchQuery');
    this.customInstructions = document.getElementById('customInstructions');
    this.startResearchBtn = document.getElementById('startResearchBtn');
    this.queryCharCounter = document.getElementById('queryCharCounter');
    this.queryWordCounter = document.getElementById('queryWordCounter');
    this.clearPromptBtn = document.getElementById('clearPromptBtn');
    this.enhancePromptBtn = document.getElementById('enhancePromptBtn');

    // Active progress view
    this.activeTaskIdDisplay = document.getElementById('activeTaskIdDisplay');
    this.activeQueryTitle = document.getElementById('activeQueryTitle');
    this.activeStatusBadge = document.getElementById('activeStatusBadge');
    this.activeStatusLabel = document.getElementById('activeStatusLabel');
    this.progressBarFill = document.getElementById('progressBarFill');
    this.progressBarText = document.getElementById('progressBarText');
    this.cancelResearchBtn = document.getElementById('cancelResearchBtn');

    // Clarification form
    this.clarificationModal = document.getElementById('clarificationModal');
    this.clarificationForm = document.getElementById('clarificationForm');
    this.clarificationQuestionsList = document.getElementById('clarificationQuestionsList');
    this.clarificationReason = document.getElementById('clarificationReason');

    // Activity feed
    this.activityLogsContainer = document.getElementById('activityLogsContainer');
    this.logCount = document.getElementById('logCount');

    // Brief sidebar
    this.briefContentPlaceholder = document.getElementById('briefContentPlaceholder');
    this.briefContentContainer = document.getElementById('briefContentContainer');
    this.briefCoreQuestion = document.getElementById('briefCoreQuestion');
    this.briefSubtopicsList = document.getElementById('briefSubtopicsList');
    this.sourcesSummaryCount = document.getElementById('sourcesSummaryCount');

    // Report view
    this.finalReportHeaderTitle = document.getElementById('finalReportHeaderTitle');
    this.reportMarkdownContainer = document.getElementById('reportMarkdownContainer');
    this.reportStatsBadge = document.getElementById('reportStatsBadge');

    // Modals and Drawers
    this.apiStatusPill = document.getElementById('apiStatusPill');
    this.apiStatusDot = document.getElementById('apiStatusDot');
    this.apiStatusText = document.getElementById('apiStatusText');
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsForm = document.getElementById('settingsForm');
    this.settingsApiKey = document.getElementById('settingsApiKey');
    this.settingsBaseUrl = document.getElementById('settingsBaseUrl');
    this.settingsModel = document.getElementById('settingsModel');
    this.settingsTavilyKey = document.getElementById('settingsTavilyKey');
    this.settingsDemoMode = document.getElementById('settingsDemoMode');
    this.apiKeyMaskedHint = document.getElementById('apiKeyMaskedHint');
    this.tavilyKeyMaskedHint = document.getElementById('tavilyKeyMaskedHint');
    this.connectionDiagnosticBox = document.getElementById('connectionDiagnosticBox');

    this.sourcesModal = document.getElementById('sourcesModal');
    this.sourcesModalList = document.getElementById('sourcesModalList');
    this.sourcesModalSubtitle = document.getElementById('sourcesModalSubtitle');

    this.jsonModal = document.getElementById('jsonModal');
    this.jsonModalContent = document.getElementById('jsonModalContent');

    this.archModal = document.getElementById('archModal');
    this.historyDrawer = document.getElementById('historyDrawer');
    this.historyListContainer = document.getElementById('historyListContainer');
    this.historyCountBadge = document.getElementById('historyCountBadge');
    this.historySearchInput = document.getElementById('historySearchInput');
  }

  bindEvents() {
    // Form submits
    if (this.researchForm) {
      this.researchForm.addEventListener('submit', (e) => this.handleResearchSubmit(e));
    }
    if (this.clarificationForm) {
      this.clarificationForm.addEventListener('submit', (e) => this.handleClarificationSubmit(e));
    }
    if (this.settingsForm) {
      this.settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
    }

    // Query character & word counter
    if (this.researchQuery) {
      this.researchQuery.addEventListener('input', () => this.updateQueryCounters());
    }

    // Clear and Enhance Prompt buttons
    if (this.clearPromptBtn) {
      this.clearPromptBtn.addEventListener('click', () => {
        if (this.researchQuery) {
          this.researchQuery.value = '';
          this.updateQueryCounters();
          this.researchQuery.focus();
        }
      });
    }

    if (this.enhancePromptBtn) {
      this.enhancePromptBtn.addEventListener('click', () => this.enhanceCurrentPrompt());
    }

    // Depth & Provider card selection
    document.querySelectorAll('.depth-card').forEach((card) => {
      card.addEventListener('click', () => {
        const parentGrid = card.parentElement;
        parentGrid.querySelectorAll('.depth-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Settings Modal
    if (this.apiStatusPill) {
      this.apiStatusPill.addEventListener('click', () => this.openSettingsModal());
    }
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettingsModal());
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());

    // Password visibility toggles
    const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
    if (toggleApiKeyVisibility && this.settingsApiKey) {
      toggleApiKeyVisibility.addEventListener('click', () => {
        const isPass = this.settingsApiKey.type === 'password';
        this.settingsApiKey.type = isPass ? 'text' : 'password';
        toggleApiKeyVisibility.innerHTML = isPass
          ? '<i data-lucide="eye-off" class="w-4 h-4"></i>'
          : '<i data-lucide="eye" class="w-4 h-4"></i>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    const toggleTavilyKeyVisibility = document.getElementById('toggleTavilyKeyVisibility');
    if (toggleTavilyKeyVisibility && this.settingsTavilyKey) {
      toggleTavilyKeyVisibility.addEventListener('click', () => {
        const isPass = this.settingsTavilyKey.type === 'password';
        this.settingsTavilyKey.type = isPass ? 'text' : 'password';
        toggleTavilyKeyVisibility.innerHTML = isPass
          ? '<i data-lucide="eye-off" class="w-4 h-4"></i>'
          : '<i data-lucide="eye" class="w-4 h-4"></i>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Provider preset buttons
    document.querySelectorAll('.provider-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-provider');
        this.applyProviderPreset(p);
      });
    });

    // Architecture Guide Modal
    const archBtn = document.getElementById('archBtn');
    const closeArchBtn = document.getElementById('closeArchBtn');
    if (archBtn) archBtn.addEventListener('click', () => this.openArchModal());
    if (closeArchBtn) closeArchBtn.addEventListener('click', () => this.closeArchModal());

    // Sources Modal
    const closeSourcesBtn = document.getElementById('closeSourcesBtn');
    if (closeSourcesBtn) closeSourcesBtn.addEventListener('click', () => this.closeSourcesModal());

    // JSON Modal
    const closeJsonBtn = document.getElementById('closeJsonBtn');
    if (closeJsonBtn) closeJsonBtn.addEventListener('click', () => this.closeJsonModal());

    // History Drawer events
    const historyBtn = document.getElementById('historyBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    if (historyBtn) historyBtn.addEventListener('click', () => this.openHistoryDrawer());
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => this.closeHistoryDrawer());

    // History search filter
    if (this.historySearchInput) {
      this.historySearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('.history-task-card').forEach((card) => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(val) ? 'block' : 'none';
        });
      });
    }

    // Sample prompt chip click listeners
    document.querySelectorAll('.prompt-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt') || chip.innerText.trim();
        if (promptText) {
          this.setSamplePrompt(promptText);
        }
      });
    });

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateQueryCounters() {
    if (!this.researchQuery) return;
    const val = this.researchQuery.value.trim();
    const charLen = this.researchQuery.value.length;
    const wordCount = val ? val.split(/\s+/).length : 0;
    if (this.queryCharCounter) this.queryCharCounter.textContent = `${charLen} chars`;
    if (this.queryWordCounter) this.queryWordCounter.textContent = `${wordCount} words`;
  }

  enhanceCurrentPrompt() {
    if (!this.researchQuery) return;
    let val = this.researchQuery.value.trim();
    if (!val) {
      val = "Comparative analysis of multi-agent LLM systems vs single-agent workflows";
    }
    const enhanced = `${val}\n\nKey Requirements:\n1. Detailed architectural breakdown and state management trade-offs\n2. Real-time benchmarks, latency, and token cost considerations\n3. Practical production deployment patterns and 2026 outlook\n4. Verified source citations with comparative markdown summary tables`;
    this.setSamplePrompt(enhanced);
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (window.lucide) window.lucide.createIcons();
  }

  setSamplePrompt(promptText) {
    if (this.researchQuery) {
      this.researchQuery.value = promptText;
      this.updateQueryCounters();
      this.researchQuery.focus();

      // Visual feedback: show badge and glow effect
      const badge = document.getElementById('promptFilledBadge');
      if (badge) {
        badge.classList.remove('hidden');
        setTimeout(() => {
          badge.classList.add('hidden');
        }, 2200);
      }

      this.researchQuery.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        this.researchQuery.classList.remove('ring-2', 'ring-blue-500');
      }, 1000);
    }
  }

  resetForm() {
    if (this.researchForm) this.researchForm.reset();
    if (this.researchQuery) this.researchQuery.value = '';
    if (this.customInstructions) this.customInstructions.value = '';
    this.updateQueryCounters();
    document.querySelectorAll('.depth-card').forEach((c) => c.classList.remove('selected'));
    const defaultDepth = document.querySelector('input[name="depth"][value="in-depth"]');
    if (defaultDepth) {
      defaultDepth.checked = true;
      defaultDepth.closest('.depth-card')?.classList.add('selected');
    }
    const defaultSearch = document.querySelector('input[name="search_provider"][value="auto"]');
    if (defaultSearch) {
      defaultSearch.checked = true;
      defaultSearch.closest('.depth-card')?.classList.add('selected');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // ============================================================================
  // Configuration & Settings Management
  // ============================================================================
  async loadConfig() {
    try {
      const cfg = await API.getConfig();
      this.systemConfig = cfg;
      this.updateApiStatusPill(cfg);
    } catch (e) {
      console.warn('Failed to load system config:', e);
      if (this.apiStatusText) this.apiStatusText.textContent = 'API Offline';
      if (this.apiStatusPill) {
        this.apiStatusPill.className = 'api-status-pill api-status-warning';
      }
    }
  }

  updateApiStatusPill(cfg) {
    if (!this.apiStatusPill || !this.apiStatusText || !this.apiStatusDot) return;
    
    if (cfg.demo_mode) {
      this.apiStatusPill.className = 'api-status-pill api-status-demo';
      this.apiStatusDot.className = 'w-2 h-2 rounded-full bg-purple-400 animate-pulse';
      this.apiStatusText.textContent = 'Demo Mode';
    } else if (cfg.openai_configured) {
      this.apiStatusPill.className = 'api-status-pill api-status-ready';
      this.apiStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      this.apiStatusText.textContent = cfg.openai_model || 'Ready';
    } else {
      this.apiStatusPill.className = 'api-status-pill api-status-warning';
      this.apiStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
      this.apiStatusText.textContent = 'Set API Key';
    }
  }

  openSettingsModal() {
    if (this.settingsModal) {
      this.settingsModal.classList.remove('hidden');
      if (this.systemConfig) {
        if (this.settingsBaseUrl) this.settingsBaseUrl.value = this.systemConfig.openai_base_url || 'https://api.openai.com/v1';
        if (this.settingsModel) this.settingsModel.value = this.systemConfig.openai_model || 'gpt-4o-mini';
        if (this.settingsDemoMode) this.settingsDemoMode.checked = !!this.systemConfig.demo_mode;
        if (this.apiKeyMaskedHint) {
          this.apiKeyMaskedHint.textContent = this.systemConfig.openai_masked_key ? `Active: ${this.systemConfig.openai_masked_key}` : 'No key set';
        }
        if (this.tavilyKeyMaskedHint) {
          this.tavilyKeyMaskedHint.textContent = this.systemConfig.tavily_masked_key ? `Active: ${this.systemConfig.tavily_masked_key}` : 'Using DuckDuckGo fallback';
        }
      }
      if (this.connectionDiagnosticBox) this.connectionDiagnosticBox.classList.add('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeSettingsModal() {
    if (this.settingsModal) this.settingsModal.classList.add('hidden');
  }

  applyProviderPreset(provider) {
    if (!this.settingsBaseUrl || !this.settingsModel) return;

    if (provider === 'openai') {
      this.settingsBaseUrl.value = 'https://api.openai.com/v1';
      this.settingsModel.value = 'gpt-4o-mini';
    } else if (provider === 'deepseek') {
      this.settingsBaseUrl.value = 'https://api.deepseek.com/v1';
      this.settingsModel.value = 'deepseek-chat';
    } else if (provider === 'openrouter') {
      this.settingsBaseUrl.value = 'https://openrouter.ai/api/v1';
      this.settingsModel.value = 'anthropic/claude-3.5-sonnet';
    } else if (provider === 'groq') {
      this.settingsBaseUrl.value = 'https://api.groq.com/openai/v1';
      this.settingsModel.value = 'llama-3.3-70b-versatile';
    } else if (provider === 'ollama') {
      this.settingsBaseUrl.value = 'http://localhost:11434/v1';
      this.settingsModel.value = 'llama3.2';
    } else if (provider === 'custom') {
      this.settingsBaseUrl.placeholder = 'https://your-custom-endpoint/v1';
    }
  }

  async testSystemConnection() {
    const btn = document.getElementById('testConnectionBtn');
    const box = this.connectionDiagnosticBox;
    if (!box) return;

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Testing...</span>`;
        if (window.lucide) window.lucide.createIcons();
      }

      box.classList.remove('hidden');
      box.className = 'p-3 rounded-xl text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 space-y-1';
      box.innerHTML = `<div><i data-lucide="loader" class="inline w-3 h-3 animate-spin"></i> Pinging LLM and Search endpoints...</div>`;
      if (window.lucide) window.lucide.createIcons();

      const testPayload = {
        openai_api_key: this.settingsApiKey.value.trim() || undefined,
        openai_base_url: this.settingsBaseUrl.value.trim() || undefined,
        openai_model: this.settingsModel.value.trim() || undefined,
        tavily_api_key: this.settingsTavilyKey.value.trim() || undefined,
      };

      const result = await API.testConnection(testPayload);
      
      const llmColor = result.llm_connected ? 'text-emerald-400' : 'text-amber-400';
      const searchColor = result.search_connected ? 'text-emerald-400' : 'text-amber-400';

      box.innerHTML = `
        <div class="flex items-center space-x-1.5 ${llmColor}">
          <span>${result.llm_connected ? '✅' : '⚠️'}</span>
          <span><strong>LLM:</strong> ${result.llm_message}</span>
        </div>
        <div class="flex items-center space-x-1.5 ${searchColor}">
          <span>${result.search_connected ? '✅' : '⚠️'}</span>
          <span><strong>Search:</strong> ${result.search_message}</span>
        </div>
      `;
    } catch (e) {
      box.innerHTML = `<div class="text-red-400">❌ Error running test: ${e.message}</div>`;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="activity" class="w-3.5 h-3.5 text-blue-400"></i><span>Test Connection</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  async handleSettingsSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveSettingsBtn');

    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span>Saving...</span>`;
      }

      const payload = {
        openai_base_url: this.settingsBaseUrl.value.trim(),
        openai_model: this.settingsModel.value.trim(),
        demo_mode: this.settingsDemoMode.checked,
      };

      if (this.settingsApiKey.value.trim()) {
        payload.openai_api_key = this.settingsApiKey.value.trim();
      }
      if (this.settingsTavilyKey.value.trim()) {
        payload.tavily_api_key = this.settingsTavilyKey.value.trim();
      }

      const updated = await API.updateConfig(payload);
      this.systemConfig = updated;
      this.updateApiStatusPill(updated);
      this.settingsApiKey.value = '';
      this.settingsTavilyKey.value = '';

      alert('Configuration saved successfully!');
      this.closeSettingsModal();
    } catch (err) {
      alert(`Failed to save configuration: ${err.message}`);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>Save Settings</span>`;
      }
    }
  }

  resetSettingsToDefaults() {
    if (this.settingsBaseUrl) this.settingsBaseUrl.value = 'https://api.openai.com/v1';
    if (this.settingsModel) this.settingsModel.value = 'gpt-4o-mini';
    if (this.settingsApiKey) this.settingsApiKey.value = '';
    if (this.settingsTavilyKey) this.settingsTavilyKey.value = '';
    if (this.settingsDemoMode) this.settingsDemoMode.checked = false;
  }

  // ============================================================================
  // Research Execution & Streaming
  // ============================================================================
  async loadHistoryCount() {
    try {
      const list = await API.getHistory();
      if (this.historyCountBadge) {
        this.historyCountBadge.textContent = list ? list.length : 0;
      }
    } catch (e) {
      console.warn('History check:', e);
    }
  }

  getSelectedDepth() {
    const checked = document.querySelector('input[name="depth"]:checked');
    return checked ? checked.value : 'in-depth';
  }

  getSelectedSearchProvider() {
    const checked = document.querySelector('input[name="search_provider"]:checked');
    return checked ? checked.value : 'auto';
  }

  async handleResearchSubmit(e) {
    e.preventDefault();
    const query = this.researchQuery.value.trim();
    if (!query) return;

    const depth = this.getSelectedDepth();
    const customInstructions = this.customInstructions.value.trim();

    try {
      this.startResearchBtn.disabled = true;
      this.startResearchBtn.innerHTML = `
        <i data-lucide="loader" class="w-5 h-5 animate-spin"></i>
        <span>Initializing Multi-Agent Pipeline...</span>
      `;
      if (window.lucide) window.lucide.createIcons();

      const result = await API.startResearch(query, depth, customInstructions);
      this.currentTaskId = result.task_id;

      // Switch to progress view
      this.showProgressView(query, this.currentTaskId);

      // Connect SSE stream
      this.connectStream(this.currentTaskId);
      this.loadHistoryCount();
    } catch (err) {
      alert(`Error starting research: ${err.message}`);
    } finally {
      this.startResearchBtn.disabled = false;
      this.startResearchBtn.innerHTML = `
        <i data-lucide="sparkles" class="w-5 h-5"></i>
        <span>Launch Deep Research</span>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  showProgressView(query, taskId) {
    this.inputSection.classList.add('hidden');
    this.reportSection.classList.add('hidden');
    this.progressSection.classList.remove('hidden');

    this.activeTaskIdDisplay.textContent = `Task ID: ${taskId}`;
    this.activeQueryTitle.textContent = query;
    this.updateProgress(15, 'Scoping & User Clarification');
    
    GraphVisualizer.setActiveNode('scope');

    // Reset containers
    this.activityLogsContainer.innerHTML = '';
    this.rawLogs = [];
    this.logEntriesCount = 0;
    this.logCount.textContent = '0 events';
    this.clarificationModal.classList.add('hidden');
    this.briefContentPlaceholder.classList.remove('hidden');
    this.briefContentContainer.classList.add('hidden');
  }

  async cancelActiveResearch() {
    if (!this.currentTaskId) return;
    if (!confirm('Are you sure you want to abort this research run?')) return;

    try {
      await API.cancelTask(this.currentTaskId);
      this.addActivityLog('error', 'Research task cancelled by user.');
      this.activeStatusBadge.className = 'status-badge bg-red-950 text-red-300 border-red-800';
      this.activeStatusLabel.textContent = 'Cancelled';
      if (this.streamClient) this.streamClient.disconnect();
    } catch (e) {
      alert(`Failed to cancel task: ${e.message}`);
    }
  }

  connectStream(taskId) {
    if (this.streamClient) {
      this.streamClient.disconnect();
    }

    this.streamClient = new ResearchStreamClient(taskId, {
      onOpen: () => {
        this.addActivityLog('connection', 'Connected to real-time agent event stream.');
      },
      node_transition: (data) => {
        const node = data.node;
        this.addActivityLog('node', data.message || `Transitioning to ${node}`, node);
        if (node === 'scoping') {
          this.updateProgress(20, 'Scoping & Clarification');
          GraphVisualizer.setActiveNode('scope');
        } else if (node === 'supervisor') {
          this.updateProgress(45, 'Supervisor Multi-Agent Coordination');
          GraphVisualizer.setActiveNode('supervisor');
        } else if (node === 'parallel_researchers') {
          this.updateProgress(65, 'Parallel Subagent Web Research');
          GraphVisualizer.setActiveNode('workers');
        } else if (node === 'writer') {
          this.updateProgress(85, 'Synthesizing Final Report & Citations');
          GraphVisualizer.setActiveNode('writer');
        }
      },
      waiting_for_clarification: (data) => {
        this.showClarificationModal(data);
      },
      clarification_received: (data) => {
        this.clarificationModal.classList.add('hidden');
        this.addActivityLog('scoping', data.message || 'Clarification answers received.');
        this.updateProgress(35, 'Finalizing Research Brief');
      },
      brief_ready: (data) => {
        this.addActivityLog('scoping', data.message || 'Research brief constructed.');
        this.renderBriefSidebar(data.brief);
      },
      supervisor_plan: (data) => {
        this.addActivityLog('supervisor', data.message || `Dispatched parallel subagents.`);
      },
      subagent_start: (data) => {
        this.addActivityLog('search', data.message || `Subagent researching '${data.topic}'`);
      },
      subagent_complete: (data) => {
        this.addActivityLog('search', data.message || `Subagent completed '${data.topic}'`);
      },
      completed: (data) => {
        this.updateProgress(100, 'Research Completed');
        GraphVisualizer.markAllComplete();
        this.addActivityLog('writer', 'Research completed successfully! Final report generated.');
        this.loadHistoryCount();
        setTimeout(() => {
          this.renderFinalReport(data.report);
        }, 800);
      },
      cancelled: (data) => {
        this.activeStatusBadge.className = 'status-badge bg-red-950 text-red-300 border-red-800';
        this.activeStatusLabel.textContent = 'Cancelled';
        this.addActivityLog('error', data.message || 'Research task was cancelled.');
      },
      failed: (data) => {
        this.activeStatusBadge.className = 'status-badge bg-red-950 text-red-300 border-red-800';
        this.activeStatusLabel.textContent = 'Execution Failed';
        this.addActivityLog('error', data.message || data.error || 'An error occurred during execution.');
      },
    });

    this.streamClient.connect();
  }

  showClarificationModal(data) {
    this.updateProgress(25, 'Clarification Requested');
    this.activeStatusBadge.className = 'status-badge status-waiting';
    this.activeStatusLabel.textContent = 'Needs User Input';

    this.clarificationReason.textContent = data.reasoning || 'Please provide additional details to focus the research.';
    this.clarificationQuestionsList.innerHTML = '';

    const questions = data.questions || [];
    questions.forEach((q, idx) => {
      const qCard = document.createElement('div');
      qCard.className = 'bg-slate-900 p-3.5 rounded-xl border border-amber-500/30';
      qCard.innerHTML = `
        <label class="block text-xs font-semibold text-amber-200 mb-1.5">
          ${idx + 1}. ${q}
        </label>
        <input
          type="text"
          name="q_${idx}"
          required
          placeholder="Type your response here..."
          class="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
        />
      `;
      this.clarificationQuestionsList.appendChild(qCard);
    });

    this.clarificationModal.classList.remove('hidden');
    const firstInput = this.clarificationQuestionsList.querySelector('input');
    if (firstInput) firstInput.focus();
    if (window.lucide) window.lucide.createIcons();
  }

  async skipClarification() {
    if (!this.currentTaskId) return;
    const dummyResponses = {};
    const inputs = this.clarificationQuestionsList.querySelectorAll('input');
    inputs.forEach((inp, idx) => {
      dummyResponses[`q_${idx}`] = 'Proceed with best professional judgment and standard industry scope.';
    });
    
    try {
      await API.submitClarification(this.currentTaskId, dummyResponses, 'Auto-skipped clarification.');
      this.clarificationModal.classList.add('hidden');
      this.activeStatusBadge.className = 'status-badge status-running';
      this.activeStatusLabel.textContent = 'Resuming Workflow';
    } catch (err) {
      alert(`Error skipping clarification: ${err.message}`);
    }
  }

  async handleClarificationSubmit(e) {
    e.preventDefault();
    if (!this.currentTaskId) return;

    const formData = new FormData(this.clarificationForm);
    const responses = {};
    for (const [key, val] of formData.entries()) {
      responses[key] = val;
    }

    try {
      const submitBtn = document.getElementById('submitClarificationBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Submitting...</span>`;
      }
      await API.submitClarification(this.currentTaskId, responses);
      this.clarificationModal.classList.add('hidden');
      this.activeStatusBadge.className = 'status-badge status-running';
      this.activeStatusLabel.textContent = 'Resuming Workflow';
    } catch (err) {
      alert(`Error submitting clarification: ${err.message}`);
    }
  }

  renderBriefSidebar(brief) {
    if (!brief) return;
    this.briefContentPlaceholder.classList.add('hidden');
    this.briefContentContainer.classList.remove('hidden');

    this.briefCoreQuestion.textContent = brief.core_question || brief.title;
    this.briefSubtopicsList.innerHTML = '';

    (brief.sub_topics || []).forEach((st, i) => {
      const item = document.createElement('div');
      item.className = 'flex items-center space-x-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50';
      item.innerHTML = `
        <span class="w-5 h-5 rounded-full bg-blue-900/80 text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0">${i+1}</span>
        <span class="truncate">${st}</span>
      `;
      this.briefSubtopicsList.appendChild(item);
    });
  }

  addActivityLog(category, text, extraTag = '') {
    this.logEntriesCount++;
    if (this.logCount) this.logCount.textContent = `${this.logEntriesCount} events`;

    const time = new Date().toLocaleTimeString();
    const logItem = { category, text, time, extraTag };
    this.rawLogs.push(logItem);

    if (this.activeLogFilter === 'all' || this.activeLogFilter === category || this.activeLogFilter === extraTag) {
      this.appendLogDOM(logItem);
    }
  }

  appendLogDOM(logItem) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let iconHtml = '<i data-lucide="info" class="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0"></i>';
    if (logItem.category === 'search') {
      iconHtml = '<i data-lucide="globe" class="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0"></i>';
    } else if (logItem.category === 'supervisor') {
      iconHtml = '<i data-lucide="git-branch" class="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0"></i>';
    } else if (logItem.category === 'writer') {
      iconHtml = '<i data-lucide="file-text" class="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0"></i>';
    } else if (logItem.category === 'error') {
      iconHtml = '<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"></i>';
    }

    entry.innerHTML = `
      ${iconHtml}
      <div class="flex-1">
        <div class="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
          <span class="uppercase tracking-wider font-semibold font-mono">${logItem.category}</span>
          <span class="font-mono">${logItem.time}</span>
        </div>
        <p class="text-slate-200 leading-snug">${logItem.text}</p>
      </div>
    `;

    this.activityLogsContainer.appendChild(entry);
    if (this.autoScrollEnabled) {
      this.activityLogsContainer.scrollTop = this.activityLogsContainer.scrollHeight;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  setLogFilter(filterKey) {
    this.activeLogFilter = filterKey;
    document.querySelectorAll('.filter-tab[data-filter]').forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-filter') === filterKey);
    });

    this.activityLogsContainer.innerHTML = '';
    const filtered = filterKey === 'all'
      ? this.rawLogs
      : this.rawLogs.filter((l) => l.category === filterKey || l.extraTag === filterKey);

    filtered.forEach((l) => this.appendLogDOM(l));
  }

  filterLogsByNode(nodeKey) {
    if (nodeKey === 'scope') this.setLogFilter('scoping');
    else if (nodeKey === 'supervisor') this.setLogFilter('supervisor');
    else if (nodeKey === 'workers') this.setLogFilter('search');
    else if (nodeKey === 'writer') this.setLogFilter('writer');
  }

  copyActivityLogs() {
    const text = this.rawLogs.map((l) => `[${l.time}] [${l.category.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copyLogsBtn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i>`;
          if (window.lucide) window.lucide.createIcons();
        }, 1800);
      }
    });
  }

  clearActivityLogs() {
    this.activityLogsContainer.innerHTML = '';
  }

  toggleAutoScroll() {
    this.autoScrollEnabled = !this.autoScrollEnabled;
    const btn = document.getElementById('autoScrollToggle');
    if (btn) {
      btn.textContent = `Auto-Scroll: ${this.autoScrollEnabled ? 'ON' : 'OFF'}`;
      btn.className = this.autoScrollEnabled
        ? 'px-2 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-mono transition cursor-pointer'
        : 'px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-mono transition cursor-pointer';
    }
  }

  updateProgress(pct, label) {
    this.progressBarFill.style.width = `${pct}%`;
    this.progressBarText.textContent = `${pct}%`;
    if (label) {
      this.activeStatusLabel.textContent = label;
    }
  }

  // ============================================================================
  // Final Report Rendering & Action Handlers
  // ============================================================================
  renderFinalReport(report) {
    if (!report) return;
    this.currentReport = report;

    this.progressSection.classList.add('hidden');
    this.reportSection.classList.remove('hidden');

    this.finalReportHeaderTitle.textContent = report.title || 'Deep Research Report';

    const rawMarkdown = report.full_markdown || `# ${report.title}\n\n${report.executive_summary}`;
    this.reportMarkdownContainer.innerHTML = marked.parse(rawMarkdown);

    // Reading stats
    const words = rawMarkdown.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 220));
    const sourcesCount = (report.sources || []).length;
    if (this.reportStatsBadge) {
      this.reportStatsBadge.textContent = `⏱️ ~${readTime} min read • ${words} words • ${sourcesCount} citations`;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  returnToExecutionTrace() {
    this.reportSection.classList.add('hidden');
    this.progressSection.classList.remove('hidden');
  }

  copyReportToClipboard() {
    if (!this.currentReport || !this.currentReport.full_markdown) return;
    navigator.clipboard.writeText(this.currentReport.full_markdown).then(() => {
      const btn = document.getElementById('copyReportBtn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Copied!</span>`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="copy" class="w-4 h-4"></i><span>Copy</span>`;
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      }
    });
  }

  exportReport(format) {
    if (!this.currentTaskId) return;
    window.open(API.getExportUrl(this.currentTaskId, format), '_blank');
  }

  resetToNewResearch() {
    if (this.streamClient) {
      this.streamClient.disconnect();
    }
    this.currentTaskId = null;
    this.currentReport = null;

    this.progressSection.classList.add('hidden');
    this.reportSection.classList.add('hidden');
    this.inputSection.classList.remove('hidden');
    if (this.researchQuery) {
      this.researchQuery.value = '';
      this.updateQueryCounters();
      this.researchQuery.focus();
    }
  }

  // ============================================================================
  // Sources & Citations Modal
  // ============================================================================
  async openSourcesModal() {
    this.sourcesModal.classList.remove('hidden');
    let sources = [];

    if (this.currentReport && this.currentReport.sources) {
      sources = this.currentReport.sources;
    } else if (this.currentTaskId) {
      try {
        const task = await API.getTaskStatus(this.currentTaskId);
        sources = task.sources || (task.final_report ? task.final_report.sources : []);
      } catch (e) {
        console.warn('Could not fetch task sources:', e);
      }
    }

    if (this.sourcesModalSubtitle) {
      this.sourcesModalSubtitle.textContent = `${sources.length} web references verified`;
    }

    if (sources.length === 0) {
      this.sourcesModalList.innerHTML = `
        <div class="text-center py-8 text-slate-500 text-xs">
          No web sources gathered yet. They will appear here during subagent research.
        </div>
      `;
    } else {
      this.sourcesModalList.innerHTML = '';
      sources.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-3';
        const url = s.url || '#';
        let domain = '';
        try { domain = new URL(url).hostname; } catch (e) { domain = 'web'; }

        card.innerHTML = `
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-1">
              <span class="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono text-[10px] border border-blue-800/60">${domain}</span>
              <span class="text-slate-500 text-[10px]">#${idx+1}</span>
            </div>
            <h4 class="font-bold text-xs text-slate-100">${s.title || 'Web Reference'}</h4>
            <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">${s.snippet || s.content || ''}</p>
          </div>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-700/50 hover:bg-blue-600 text-slate-300 hover:text-white transition shrink-0" title="Visit source">
            <i data-lucide="external-link" class="w-4 h-4"></i>
          </a>
        `;
        this.sourcesModalList.appendChild(card);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  closeSourcesModal() {
    this.sourcesModal.classList.add('hidden');
  }

  // ============================================================================
  // Raw JSON State Modal
  // ============================================================================
  async openJsonModal() {
    this.jsonModal.classList.remove('hidden');
    if (!this.currentTaskId) {
      this.jsonModalContent.textContent = JSON.stringify({ message: "No active task selected." }, null, 2);
      return;
    }

    try {
      this.jsonModalContent.textContent = "Loading task JSON state...";
      const task = await API.getTaskStatus(this.currentTaskId);
      this.currentTaskData = task;
      this.jsonModalContent.textContent = JSON.stringify(task, null, 2);
    } catch (e) {
      this.jsonModalContent.textContent = JSON.stringify({ error: e.message }, null, 2);
    }
  }

  closeJsonModal() {
    this.jsonModal.classList.add('hidden');
  }

  copyRawJson() {
    const text = this.jsonModalContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copyJsonBtn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Copied!</span>`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy JSON</span>`;
          if (window.lucide) window.lucide.createIcons();
        }, 1800);
      }
    });
  }

  // ============================================================================
  // Architecture Guide Modal Handlers
  // ============================================================================
  openArchModal() {
    this.archModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeArchModal() {
    this.archModal.classList.add('hidden');
  }

  setArchTab(tabKey) {
    document.querySelectorAll('.filter-tab[data-arch-tab]').forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-arch-tab') === tabKey);
    });

    const tabs = ['Flow', 'State', 'Tools', 'Resume'];
    tabs.forEach((t) => {
      const el = document.getElementById(`archTab${t}`);
      if (el) {
        el.classList.toggle('hidden', t.toLowerCase() !== tabKey);
      }
    });
  }

  // ============================================================================
  // History Drawer Handlers
  // ============================================================================
  async openHistoryDrawer() {
    this.historyDrawer.classList.remove('hidden');
    this.historyListContainer.innerHTML = `
      <div class="flex items-center justify-center p-8 text-slate-400">
        <i data-lucide="loader" class="w-6 h-6 animate-spin"></i>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
      const history = await API.getHistory();
      if (!history || history.length === 0) {
        this.historyListContainer.innerHTML = `
          <div class="text-center py-10 text-slate-400 text-xs">
            No research history yet. Start your first research task!
          </div>
        `;
        return;
      }

      this.historyListContainer.innerHTML = '';
      history.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'history-task-card p-3 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer';
        const isComplete = item.status === 'completed';
        const statusBadgeColor = isComplete ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-blue-950 text-blue-300 border-blue-800';

        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex-1 pr-2" onclick="app.loadHistoricalTask('${item.task_id}')">
              <div class="flex items-center space-x-2 mb-1">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-mono border ${statusBadgeColor}">${item.status}</span>
                <span class="text-[10px] text-slate-500 font-mono">${new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <h4 class="font-bold text-xs text-slate-100 line-clamp-2">${item.title || item.query}</h4>
            </div>
            <button onclick="app.deleteHistoryItem('${item.task_id}', event)" class="p-1 text-slate-400 hover:text-red-400 rounded cursor-pointer" title="Delete session">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
        this.historyListContainer.appendChild(card);
      });
      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      this.historyListContainer.innerHTML = `<div class="text-red-400 text-xs p-4">Error loading history: ${e.message}</div>`;
    }
  }

  closeHistoryDrawer() {
    this.historyDrawer.classList.add('hidden');
  }

  async loadHistoricalTask(taskId) {
    try {
      const task = await API.getTaskStatus(taskId);
      this.closeHistoryDrawer();
      this.currentTaskId = taskId;

      if (task.final_report) {
        this.renderFinalReport(task.final_report);
      } else {
        this.showProgressView(task.query, taskId);
        this.connectStream(taskId);
      }
    } catch (err) {
      alert(`Could not load task: ${err.message}`);
    }
  }

  async deleteHistoryItem(taskId, e) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this research session?')) return;
    try {
      await API.deleteTask(taskId);
      this.openHistoryDrawer();
      this.loadHistoryCount();
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
    }
  }

  async clearAllHistory() {
    if (!confirm('Are you sure you want to clear ALL research history? This cannot be undone.')) return;
    try {
      await API.clearHistory();
      this.openHistoryDrawer();
      this.loadHistoryCount();
    } catch (err) {
      alert(`Failed to clear history: ${err.message}`);
    }
  }
}

// Initialize Application
const app = new DeepResearchApp();
window.app = app;
