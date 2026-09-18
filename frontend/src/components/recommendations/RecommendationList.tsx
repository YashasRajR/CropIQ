import React, { useState } from 'react';
import { ShieldCheck, Filter } from 'lucide-react';
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

  const filtered =
    selectedCategory === 'ALL'
      ? recommendations
      : recommendations.filter((r) => r.category === selectedCategory);

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="recommendations-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              What You Can Do
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Practical management steps based on your farm's conditions and risk indicators.
          </p>
        </div>

        {/* View Mode Toggle (Farmer View vs Technical Audit) */}
        {onToggleMode && (
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onToggleMode('farmer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                currentMode === 'farmer'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Farmer View
            </button>
            <button
              type="button"
              onClick={() => onToggleMode('technical')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                currentMode === 'technical'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Technical Mode
            </button>
          </div>
        )}
      </div>

      {/* Executive Summary Callout */}
      {executiveSummary && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
          <strong className="font-semibold text-emerald-900 block mb-1">
            Advisory Summary:
          </strong>
          {executiveSummary}
        </div>
      )}

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-medium shrink-0">Filter by category:</span>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="col-span-2 text-center py-10 text-slate-400 text-sm">
            No recommendations in this category.
          </div>
        )}
      </div>
    </Card>
  );
};
