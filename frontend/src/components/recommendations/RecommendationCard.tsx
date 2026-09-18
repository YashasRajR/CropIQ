import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, Eye, ArrowRight, Lightbulb, Code2 } from 'lucide-react';
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
  const [showTechnical, setShowTechnical] = useState(isTechnicalMode);

  const icon = CATEGORY_ICONS[item.category] || '🌱';
  const isHigh = item.priority === 'HIGH';
  const isMed = item.priority === 'MEDIUM';

  const actionabilityVariant =
    item.actionability === 'ACTIONABLE'
      ? 'emerald'
      : item.actionability === 'MONITORING'
      ? 'sky'
      : 'slate';

  return (
    <Card
      variant="default"
      className="p-5 sm:p-6 bg-white hover:border-emerald-300 transition-all border border-slate-200/90 shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Badges: Category, Priority, Actionability */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="slate" size="sm">
              <span>{icon} {item.category}</span>
            </Badge>
            <Badge variant={isHigh ? 'rose' : isMed ? 'amber' : 'emerald'} size="sm">
              <span>{item.priority} Priority</span>
            </Badge>
            {item.actionability && (
              <Badge variant={actionabilityVariant} size="sm">
                <span>{item.actionability}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-3">
          {item.title}
        </h3>

        {/* 3-Step Clear Farmer Advisory Structure */}
        <div className="space-y-3 text-xs mb-4">
          {/* 1. What we noticed */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="uppercase tracking-wider text-[10px] text-slate-600">
                What we noticed:
              </span>
            </div>
            <p className="text-slate-900 text-xs leading-relaxed font-medium">
              {item.summary || item.reason}
            </p>
          </div>

          {/* 2. What you can consider doing */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="uppercase tracking-wider text-[10px] text-emerald-800">
                What you can consider doing:
              </span>
            </div>
            <p className="text-emerald-950 text-xs leading-relaxed font-semibold">
              {item.action}
            </p>
          </div>

          {/* 3. Why it matters */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-950">
            <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span className="uppercase tracking-wider text-[10px] text-amber-800">
                Why this matters:
              </span>
            </div>
            <p className="text-amber-950 text-xs leading-relaxed">
              {item.reason}
            </p>
          </div>
        </div>

        {/* 4. Progressive Disclosure: Technical Rule Details Toggle */}
        <div className="mt-2 mb-3">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical rule details</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                showTechnical ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnical && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-2 animate-in fade-in duration-150">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Rule Identifier:</span>
                <span className="text-emerald-400 font-bold">{item.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Confidence Rating:</span>
                <span className="text-amber-400">{item.confidence}</span>
              </div>

              {item.evidence && item.evidence.length > 0 && (
                <div className="border-b border-slate-800 pb-1.5">
                  <div className="text-slate-400 mb-1">Trigger Evidence:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                    {item.evidence.map((ev, idx) => (
                      <li key={idx}>
                        {typeof ev === 'string' ? ev : JSON.stringify(ev)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.limitations && (
                <div className="text-[10px] text-slate-400 pt-0.5">
                  <span className="text-amber-400 font-semibold">Agronomic Limitations: </span>
                  {Array.isArray(item.limitations)
                    ? item.limitations.join('. ')
                    : item.limitations}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {item.what_if_supported && item.what_if_variable && onExploreScenario && (
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onExploreScenario(item.what_if_variable!)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Try in Scenario Simulator
          </Button>
        </div>
      )}
    </Card>
  );
};
