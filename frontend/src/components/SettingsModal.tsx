import React, { useState, useEffect } from 'react';
import { X, Key, Globe, Cpu, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/80 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">LLM & Search Configuration</h3>
              <p className="text-xs text-slate-400">Manage OpenAI API keys, base endpoints, and providers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
          {/* OpenAI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">OpenAI API Key</label>
              <span className="text-[10px] text-slate-500 font-mono">
                {config?.openai_configured ? `Active: ${config.openai_masked_key}` : 'Not set in .env'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 placeholder-slate-600 p-2.5 pr-10 rounded-lg border border-slate-800 focus:border-blue-500 outline-none font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Name & Base URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Model Name</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">API Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Search Provider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">Web Search Engine</label>
              <span className="text-[10px] text-slate-500 font-mono">
                DuckDuckGo works without any API keys
              </span>
            </div>
            <select
              value={searchProvider}
              onChange={(e) => setSearchProvider(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none"
            >
              <option value="duckduckgo">DuckDuckGo Free Search (No Key Required)</option>
              <option value="tavily">Tavily AI Search (Requires Tavily Key)</option>
            </select>
          </div>

          {searchProvider === 'tavily' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Tavily API Key</label>
              <input
                type="password"
                placeholder="tvly-..."
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          )}

          {/* Connection Test Diagnostics Box */}
          {testResult && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                {testResult.llm_connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-slate-300 truncate font-mono text-[11px]">
                  LLM: {testResult.llm_message}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {testResult.search_connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-slate-300 truncate font-mono text-[11px]">
                  Search: {testResult.search_message}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-medium transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Diagnostics'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
