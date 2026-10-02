import React, { useState } from 'react';
import { HelpCircle, Send, MessageSquare } from 'lucide-react';
import { ClarificationData } from '../types';

interface ClarificationModalProps {
  data: ClarificationData;
  onSubmit: (responses: Record<string, string>, additionalNotes: string) => void;
  isLoading: boolean;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  data,
  onSubmit,
  isLoading,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleAnswerChange = (idx: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [`question_${idx}`]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers, additionalNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Clarification Requested by Scoper
            </h3>
            <p className="text-xs text-slate-400">
              The research agent identified ambiguous parameters in your query.
            </p>
          </div>
        </div>

        {data.reason && (
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 mb-5">
            <span className="font-semibold text-amber-400">Agent note: </span>
            {data.reason}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {data.questions.map((q, idx) => (
            <div key={idx} className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                {idx + 1}. {q.question}
              </label>
              {q.context && (
                <p className="text-[11px] text-slate-500">{q.context}</p>
              )}
              {q.options && q.options.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleAnswerChange(idx, opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition border ${
                        answers[`question_${idx}`] === opt
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Your clarification..."
                  value={answers[`question_${idx}`] || ''}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none"
                />
              )}
            </div>
          ))}

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-medium text-slate-400">
              Additional Guidance (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any extra preferences, constraints, or directives..."
              className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center space-x-2"
            >
              <span>{isLoading ? 'Resuming Graph...' : 'Submit & Resume Research'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
