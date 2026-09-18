import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Sparkles, Code2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl h-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Technical Audit & Live API Drawer
                </h2>
                <Badge variant="sky" size="sm">Audit Mode</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Inspect raw backend JSON payloads in real time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Banner */}
        <div className="px-5 py-3 bg-emerald-950/30 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Single Source of Truth: FastAPI (Port 8000)</span>
          </div>
          {lastUpdated && (
            <span className="text-[10px] font-mono text-slate-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-5 gap-2 overflow-x-auto text-xs font-mono">
          {(['predict', 'explain', 'recommendations', 'scenario', 'input'] as TabType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
        <div className="px-5 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-400 font-bold">{getEndpointForTab(activeTab)}</span>
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="flex-1 overflow-auto p-5 font-mono text-xs text-slate-300 bg-slate-950/90 select-text">
          <pre className="whitespace-pre-wrap break-words leading-relaxed font-mono">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            No client-side fabrication • All calculations server-side
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
