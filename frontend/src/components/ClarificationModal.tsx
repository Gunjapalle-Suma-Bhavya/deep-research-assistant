import React, { useState } from 'react';
import { HelpCircle, Send } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-panel border border-edge rounded-[2px] max-w-xl w-full p-6 sm:p-7 shadow-paper overflow-hidden">
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-edge">
          <div className="w-9 h-9 rounded-[2px] bg-cream border border-edge flex items-center justify-center text-forest">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-ink">
              Clarification Requested by Scoper
            </h3>
            <p className="text-xs text-muted font-body">
              The research agents require precision on ambiguous parameters.
            </p>
          </div>
        </div>

        {data.reason && (
          <div className="bg-cream p-3.5 rounded-[2px] border border-edge text-xs text-ink mb-5 font-body leading-relaxed">
            <span className="font-serif font-bold text-forest">Scoper Rationale: </span>
            {data.reason}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {data.questions.map((rawQ: any, idx) => {
            const questionText = typeof rawQ === 'string' ? rawQ : (rawQ?.question || '');
            const questionContext = typeof rawQ === 'object' ? rawQ?.context : null;
            const questionOptions = typeof rawQ === 'object' && Array.isArray(rawQ?.options) ? rawQ.options : [];

            return (
              <div key={idx} className="space-y-1.5">
                <label className="block text-xs font-serif font-bold text-ink">
                  {idx + 1}. {questionText}
                </label>
                {questionContext && (
                  <p className="text-[11px] text-muted font-body italic">{questionContext}</p>
                )}
                {questionOptions && questionOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {questionOptions.map((opt: string, oIdx: number) => (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleAnswerChange(idx, opt)}
                        className={`px-3 py-1.5 rounded-[2px] text-xs font-serif transition border ${
                          answers[`question_${idx}`] === opt
                            ? 'bg-forest text-cream border-forest font-bold'
                            : 'bg-cream text-ink border-edge hover:bg-panel'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Your clarifying guidance..."
                    value={answers[`question_${idx}`] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="w-full bg-cream text-ink text-xs p-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-body shadow-subtle"
                  />
                )}
              </div>
            );
          })}

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-serif font-bold text-muted">
              Supplementary Guidance (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any supplementary directives or methodological constraints..."
              className="w-full bg-cream text-ink text-xs p-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-body shadow-subtle"
            />
          </div>

          <div className="pt-4 flex justify-end border-t border-edge">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-[2px] bg-forest hover:bg-forest-hover text-cream text-xs font-serif font-bold shadow-subtle transition flex items-center space-x-2 cursor-pointer"
            >
              <span>{isLoading ? 'Resuming Investigation...' : 'Submit & Resume'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
