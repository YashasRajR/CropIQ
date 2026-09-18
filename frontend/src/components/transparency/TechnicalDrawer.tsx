import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TechnicalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  predictData?: unknown;
  explainData?: unknown;
  recommendationsData?: unknown;
  scenarioData?: unknown;
  currentInput?: unknown;
  lastUpdated?: Date | null;
}

type TabType = 'predict' | 'explain' | 'recommendations' | 'scenario' | 'input';

export const TechnicalDrawer: React.FC<TechnicalDrawerProps> = ({
  isOpen,
  onClose,
  predictData,
  explainData,
  recommendationsData,
  scenarioData,
  currentInput,
  lastUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('predict');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getPayloadForTab = (tab: TabType) => {
    switch (tab) {
      case 'predict':
        return predictData ?? { status: 'No prediction run yet' };
      case 'explain':
        return explainData ?? { status: 'No explanation run yet' };
      case 'recommendations':
        return recommendationsData ?? { status: 'No recommendations run yet' };
      case 'scenario':
        return scenarioData ?? { status: 'No scenario run yet' };
      case 'input':
        return currentInput ?? { status: 'No farm input set' };
    }
  };

  const getEndpointForTab = (tab: TabType) => {
    switch (tab) {
      case 'predict':
        return 'POST /predict';
      case 'explain':
        return 'POST /explain';
      case 'recommendations':
        return 'POST /recommendations';
      case 'scenario':
        return 'POST /scenario';
      case 'input':
        return 'FarmInput Payload';
    }
  };

  const activePayload = getPayloadForTab(activeTab);
  const jsonString = JSON.stringify(activePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Technical Audit: Live API Payloads
                </h2>
                <Badge variant="emerald" size="sm">Audit Mode</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Inspect raw server JSON responses in real time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Banner */}
        <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Single Source of Truth: FastAPI Backend (Port 8000)</span>
          </div>
          {lastUpdated && (
            <span className="text-[11px] text-slate-500 font-mono">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 gap-1.5 overflow-x-auto text-xs">
          {(['predict', 'explain', 'recommendations', 'scenario', 'input'] as TabType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'predict' && '1. /predict'}
              {tab === 'explain' && '2. /explain'}
              {tab === 'recommendations' && '3. /recommendations'}
              {tab === 'scenario' && '4. /scenario'}
              {tab === 'input' && '5. FarmInput'}
            </button>
          ))}
        </div>

        {/* Code Bar Controls */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center gap-1.5 font-mono">
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-900">{getEndpointForTab(activeTab)}</span>
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer text-xs font-semibold shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-800">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="flex-1 overflow-auto p-5 font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 select-text">
          <pre className="whitespace-pre-wrap break-words leading-relaxed">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Zero client-side calculations • Verified FastAPI responses
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
