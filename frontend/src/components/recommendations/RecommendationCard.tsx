import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { RecommendationItem } from '../../types/recommendation';
import { getPriorityBadge, getCategoryBadge } from '../../utils/formatting';

interface RecommendationCardProps {
  item: RecommendationItem;
  onExploreScenario?: (featureName: string) => void;
  isTechnicalMode?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onExploreScenario,
  isTechnicalMode = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="bordered" className="p-5 bg-slate-900/50 hover:bg-slate-900/80 transition-all">
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono uppercase font-bold border ${getCategoryBadge(item.category)}`}>
            {item.category}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold border ${getPriorityBadge(item.priority)}`}>
            {item.priority} PRIORITY
          </span>
        </div>

        {isTechnicalMode && (
          <span className="text-[10px] font-mono text-slate-500">ID: {item.id}</span>
        )}
      </div>

      {/* Recommendation Title & Action */}
      <h3 className="text-base font-bold text-white tracking-tight mb-1.5">
        {item.title}
      </h3>

      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 mb-3 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed font-medium">{item.action}</div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">
        {item.reason}
      </p>

      {/* Expandable Details: Evidence & Limitations */}
      {expanded && (
        <div className="pt-4 mb-4 border-t border-slate-800/80 space-y-3 text-xs animate-in fade-in duration-200">
          {/* Evidence */}
          {item.evidence && item.evidence.length > 0 && (
            <div>
              <div className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Agronomic Evidence:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
                {item.evidence.map((ev, idx) => (
                  <li key={idx}>
                    {typeof ev === 'string' ? ev : JSON.stringify(ev)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations */}
          {item.limitations && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-[11px] text-slate-400">
              <div className="flex items-center gap-1 text-amber-400 font-semibold mb-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>Limitations:</span>
              </div>
              <div>
                {Array.isArray(item.limitations)
                  ? item.limitations.join(' ')
                  : item.limitations}
              </div>
            </div>
          )}

          <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Confidence: <strong className="text-slate-300">{item.confidence}</strong></span>
            <span>Actionability: <strong className="text-slate-300">{item.actionability}</strong></span>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-850">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Less Details' : 'Evidence & Limitations'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {item.what_if_supported && onExploreScenario && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExploreScenario(item.what_if_variable || 'soil_moisture')}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
          >
            Explore Scenario
          </Button>
        )}
      </div>
    </Card>
  );
};
