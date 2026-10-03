import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  Bot,
  User,
  CornerDownLeft,
  Trash2,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { api } from '../services/api';
import { ChatMessage } from '../types';

interface ReportChatDrawerProps {
  taskId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCitation?: (index: number) => void;
}

const STARTER_PROMPTS = [
  'Summarize the core findings in 3 concise bullet points.',
  'What specific data sources or empirical metrics are cited?',
  'What limitations, policy risks, or counter-arguments were noted?',
  'Explain the future projections and implications simply.',
];

export const ReportChatDrawer: React.FC<ReportChatDrawerProps> = ({
  taskId,
  reportTitle,
  isOpen,
  onClose,
  onSelectCitation,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && taskId) {
      setLoadingHistory(true);
      api
        .getReportChatHistory(taskId)
        .then((res) => {
          if (res.history && res.history.length > 0) {
            setMessages(res.history);
          }
        })
        .catch((err) => {
          console.warn('Failed to load monograph chat history:', err);
        })
        .finally(() => {
          setLoadingHistory(false);
        });
    }
  }, [isOpen, taskId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendReportChatMessage(taskId, messageText, messages);
      if (res.history) {
        setMessages(res.history);
      } else if (res.response) {
        setMessages([
          ...updatedHistory,
          {
            role: 'assistant',
            content: res.response,
            timestamp: res.timestamp || new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `*Error generating response:* ${
          err.response?.data?.detail || err.message || 'Unable to connect to the language model.'
        }`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.citation-badge');
    if (target && onSelectCitation) {
      const idx = target.getAttribute('data-citation-index');
      if (idx) {
        onSelectCitation(parseInt(idx, 10));
      }
    }
  };

  const renderAssistantMarkdown = (content: string) => {
    let md = content;
    // Format citation chips like [1], [2] to be clickable
    md = md.replace(/\[(\d+)\]/g, (match, p1) => {
      return `<button type="button" class="citation-badge" data-citation-index="${p1}">${match}</button>`;
    });

    const rawHtml = marked.parse(md, { gfm: true, breaks: true }) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['button'],
      ADD_ATTR: ['data-citation-index', 'class', 'type'],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-cream border-l border-edge shadow-paper flex flex-col animate-slideInRight font-serif">
      {/* Drawer Masthead Header */}
      <div className="p-4 sm:p-5 border-b border-edge bg-panel flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-[2px] bg-forest text-cream flex items-center justify-center font-bold shadow-subtle">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-ink">Inquire with Monograph</h3>
            <p className="text-[11px] text-muted font-mono truncate max-w-[280px] sm:max-w-[340px]">
              {reportTitle || 'Research Dossier'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Clear discussion history"
              className="p-1.5 rounded-[2px] text-muted hover:text-rose-700 hover:bg-cream border border-transparent hover:border-edge transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-muted hover:text-ink hover:bg-cream border border-edge transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grounding Sub-bar */}
      <div className="px-4 py-2 border-b border-edge bg-panel/50 flex items-center justify-between text-[11px] font-mono text-muted">
        <span className="flex items-center space-x-1 text-forest font-semibold">
          <Sparkles className="w-3 h-3 text-forest" />
          <span>Grounded on Manuscript & Sources</span>
        </span>
        <span>{messages.length} exchanges</span>
      </div>

      {/* Messages Stream */}
      <div
        onClick={handleContentClick}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm"
      >
        {loadingHistory && (
          <div className="flex items-center justify-center py-8 text-xs font-mono text-muted space-x-2">
            <span className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
            <span>Retrieving saved discussion...</span>
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="py-6 text-center space-y-4">
            <div className="w-10 h-10 rounded-[2px] bg-panel border border-edge flex items-center justify-center mx-auto text-forest">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-ink text-base">Inquire About This Monograph</h4>
              <p className="text-xs text-muted font-serif mt-1 max-w-xs mx-auto leading-relaxed">
                Ask targeted follow-up inquiries. Responses are synthesized directly from the compiled manuscript and verified footnotes.
              </p>
            </div>

            <div className="pt-2 text-left space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                Suggested Prompts
              </span>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2.5 rounded-[2px] bg-panel hover:bg-cream border border-edge text-xs font-serif text-ink hover:text-forest transition shadow-subtle cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <CornerDownLeft className="w-3 h-3 text-muted group-hover:text-forest shrink-0 ml-2 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            } space-y-1`}
          >
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-muted px-1">
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-forest" />
                  <span>Research Fellow</span>
                </>
              )}
            </div>

            <div
              className={`p-3.5 rounded-[2px] max-w-[90%] shadow-subtle ${
                msg.role === 'user'
                  ? 'bg-panel border border-edge text-ink font-serif'
                  : 'bg-white/80 border border-edge text-ink prose-report text-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.content}</p>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderAssistantMarkdown(msg.content),
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-y-1 flex-col">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-muted px-1">
              <Bot className="w-3 h-3 text-forest" />
              <span>Research Fellow</span>
            </div>
            <div className="p-3.5 rounded-[2px] bg-white/80 border border-edge shadow-subtle flex items-center space-x-2 text-xs font-mono text-muted">
              <span className="w-3.5 h-3.5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
              <span>Consulting monograph text and citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-edge bg-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end space-x-2"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this monograph (Enter to send)..."
            className="flex-1 p-2.5 text-xs font-serif bg-cream border border-edge rounded-[2px] text-ink placeholder-muted focus:outline-none focus:border-forest resize-none leading-relaxed"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3.5 py-2.5 rounded-[2px] bg-forest hover:bg-forest/90 disabled:opacity-40 text-cream border border-forest transition cursor-pointer shadow-subtle flex items-center justify-center shrink-0"
            title="Send inquiry"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] font-mono text-muted text-center mt-2">
          Responses are grounded strictly in the compiled research dossier.
        </p>
      </div>
    </div>
  );
};
