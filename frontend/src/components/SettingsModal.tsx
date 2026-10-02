import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SystemConfig, ConnectionTestResult } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  config: SystemConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (newConfig: SystemConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [searchProvider, setSearchProvider] = useState('duckduckgo');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  useEffect(() => {
    if (config) {
      setBaseUrl(config.openai_base_url || 'https://api.openai.com/v1');
      setModel(config.openai_model || 'gpt-4o-mini');
      setSearchProvider(config.search_provider || 'duckduckgo');
      setApiKey('');
      setTavilyKey('');
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection({
        openai_api_key: apiKey || undefined,
        openai_base_url: baseUrl,
        openai_model: model,
        tavily_api_key: tavilyKey || undefined,
      });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        llm_connected: false,
        llm_message: e.message || 'Diagnostic request failed',
        search_connected: false,
        search_message: 'Unable to reach backend diagnostic endpoint',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateConfig({
        openai_api_key: apiKey.trim() ? apiKey.trim() : undefined,
        openai_base_url: baseUrl.trim(),
        openai_model: model.trim(),
        tavily_api_key: tavilyKey.trim() ? tavilyKey.trim() : undefined,
        search_provider: searchProvider,
      });
      onConfigSaved(updated);
      onClose();
    } catch (e: any) {
      alert(`Failed to save settings: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-panel border border-edge rounded-[2px] max-w-lg w-full p-6 sm:p-7 shadow-paper overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-edge">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-cream text-forest border border-edge flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-ink">Engine & Search Configuration</h3>
              <p className="text-xs text-muted font-body">Manage API keys, inference endpoints, and search tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-muted hover:text-ink hover:bg-cream border border-edge transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs font-body">
          {/* OpenAI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-serif font-bold text-ink">OpenAI API Key</label>
              <span className="text-[10px] text-muted font-mono">
                {config?.openai_configured ? `Active: ${config.openai_masked_key}` : 'Not set in .env'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-cream text-ink placeholder-muted/50 p-2.5 pr-10 rounded-[2px] border border-edge focus:border-forest outline-none font-mono text-xs shadow-subtle"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-muted hover:text-ink transition"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Name & Base URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-serif font-bold text-ink mb-1.5">Model Identifier</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-cream text-ink p-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono shadow-subtle"
              />
            </div>
            <div>
              <label className="block font-serif font-bold text-ink mb-1.5">Inference Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-cream text-ink p-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono shadow-subtle"
              />
            </div>
          </div>

          {/* Search Provider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-serif font-bold text-ink">Web Retrieval Provider</label>
              <span className="text-[10px] text-muted font-mono">
                DuckDuckGo functions with zero API keys
              </span>
            </div>
            <select
              value={searchProvider}
              onChange={(e) => setSearchProvider(e.target.value)}
              className="w-full bg-cream text-ink p-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-serif shadow-subtle"
            >
              <option value="duckduckgo">DuckDuckGo Free Search (No Key Required)</option>
              <option value="tavily">Tavily AI Search (Requires Tavily Key)</option>
            </select>
          </div>

          {searchProvider === 'tavily' && (
            <div>
              <label className="block font-serif font-bold text-ink mb-1.5">Tavily Search API Key</label>
              <input
                type="password"
                placeholder="tvly-..."
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
                className="w-full bg-cream text-ink p-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono shadow-subtle"
              />
            </div>
          )}

          {/* Diagnostics Box */}
          {testResult && (
            <div className="p-3 bg-cream rounded-[2px] border border-edge space-y-2 shadow-subtle">
              <div className="flex items-center space-x-2">
                {testResult.llm_connected ? (
                  <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <span className="text-ink truncate font-mono text-[11px]">
                  LLM: {testResult.llm_message}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {testResult.search_connected ? (
                  <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <span className="text-ink truncate font-mono text-[11px]">
                  Search: {testResult.search_message}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-edge">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-[2px] bg-cream hover:bg-panel border border-edge text-ink font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Pinging...' : 'Run Diagnostics'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-[2px] bg-forest hover:bg-forest-hover text-cream font-serif font-bold shadow-subtle transition cursor-pointer"
            >
              {isSaving ? 'Recording...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
