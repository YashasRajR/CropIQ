import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Filter } from 'lucide-react';
import { Card } from '../common/Card';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationItem } from '../../types/recommendation';

interface RecommendationListProps {
  recommendations: RecommendationItem[];
  executiveSummary?: string;
  onExploreScenario?: (featureName: string) => void;
  onToggleMode?: (mode: 'farmer' | 'technical') => void;
  currentMode?: 'farmer' | 'technical';
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  executiveSummary,
  onExploreScenario,
  onToggleMode,
  currentMode = 'farmer',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    ...Array.from(new Set(recommendations.map((r) => r.category))),
  ];

  const filtered = selectedCategory === 'ALL'
    ? recommendations
    : recommendations.filter((r) => r.category === selectedCategory);

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="recommendations-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Actionable Agricultural Guidance
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Deterministic agronomic rules evaluated against observed conditions and model risk.
          </p>
        </div>

        {/* Mode Toggle (Farmer Mode vs Technical Audit) */}
        {onToggleMode && (
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onToggleMode('farmer')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currentMode === 'farmer'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Farmer Mode
            </button>
            <button
              type="button"
              onClick={() => onToggleMode('technical')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currentMode === 'technical'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Technical Audit
            </button>
          </div>
        )}
      </div>

      {/* Executive Summary Banner */}
      {executiveSummary && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 mb-6 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-emerald-300 mb-0.5">Agronomic Executive Summary</div>
            <div className="text-xs text-slate-300 leading-relaxed">{executiveSummary}</div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors cursor-pointer flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-800 border-slate-600 text-white font-medium'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Recommendation Items List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              onExploreScenario={onExploreScenario}
              isTechnicalMode={currentMode === 'technical'}
            />
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No active recommendations for category "{selectedCategory}".
          </div>
        )}
      </div>
    </Card>
  );
};
