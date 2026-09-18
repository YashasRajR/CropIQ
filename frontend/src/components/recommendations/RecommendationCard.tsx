import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { RecommendationItem } from '../../types/recommendation';

interface RecommendationCardProps {
  item: RecommendationItem;
  onExploreScenario?: (featureName: string) => void;
  isTechnicalMode?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  WATER: '💧',
  SOIL: '🌱',
  WEATHER: '☀️',
  CANOPY: '🌿',
  MONITORING: '📋',
  CROP: '🌾',
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onExploreScenario,
  isTechnicalMode = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const icon = CATEGORY_ICONS[item.category] || '🌱';
  const isHigh = item.priority === 'HIGH';
  const isMed = item.priority === 'MEDIUM';

  return (
    <Card
      variant="default"
      className="p-5 sm:p-6 bg-white hover:border-emerald-300 transition-all border border-slate-200/90 shadow-xs"
    >
      {/* Category & Priority Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="slate" size="sm">
            <span>{icon} {item.category}</span>
          </Badge>
          <Badge variant={isHigh ? 'rose' : isMed ? 'amber' : 'emerald'} size="sm">
            <span>{item.priority} Priority</span>
          </Badge>
        </div>

        {isTechnicalMode && (
          <span className="text-[11px] font-mono text-slate-400">Rule: {item.id}</span>
        )}
      </div>

      {/* Recommendation Title */}
      <h3 className="text-base font-bold text-slate-900 tracking-tight mb-3">
        {item.title}
      </h3>

      {/* 3-Question Farmer Advisory Structure */}
      <div className="space-y-3 text-xs mb-4">
        {/* 1. What we noticed */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="uppercase tracking-wider text-[10px] font-bold text-slate-500">
              What we noticed:
            </span>
          </div>
          <p className="text-slate-900 text-xs leading-relaxed font-medium">
            {item.summary || item.reason}
          </p>
        </div>

        {/* 2. What you can do */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
          <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="uppercase tracking-wider text-[10px] font-bold text-emerald-800">
              What you can do:
            </span>
          </div>
          <p className="text-emerald-950 text-xs leading-relaxed font-semibold">
            {item.action}
          </p>
        </div>

        {/* 3. Why it matters */}
        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-950">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
            <span className="text-xs">🌾</span>
            <span className="uppercase tracking-wider text-[10px] font-bold text-amber-800">
              Why it matters:
            </span>
          </div>
          <p className="text-amber-950 text-xs leading-relaxed">
            {item.reason}
          </p>
        </div>
      </div>

      {/* Expandable Details: Evidence & Field Limitations */}
      {expanded && (
        <div className="pt-3 mb-4 border-t border-slate-200 space-y-3 text-xs animate-in fade-in duration-150">
          {item.evidence && item.evidence.length > 0 && (
            <div>
              <div className="font-semibold text-slate-700 mb-1">Observed Field Evidence:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                {item.evidence.map((ev, idx) => (
                  <li key={idx}>
                    {typeof ev === 'string' ? ev : JSON.stringify(ev)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.limitations && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note: </strong>
                {Array.isArray(item.limitations)
                  ? item.limitations.join('. ')
                  : item.limitations}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <span>{expanded ? 'Less Details' : 'View Field Evidence'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {item.what_if_supported && item.what_if_variable && onExploreScenario && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onExploreScenario(item.what_if_variable!)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Try This in a Scenario
          </Button>
        )}
      </div>
    </Card>
  );
};
