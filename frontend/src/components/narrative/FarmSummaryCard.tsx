import React from 'react';
import { Sparkles, TrendingUp, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { PredictionResponse } from '../../types/prediction';
import { FarmInput } from '../../types/farm';
import { generateFarmSummary } from '../../utils/explanations';

interface FarmSummaryCardProps {
  prediction: PredictionResponse;
  farmInput: FarmInput;
  onScrollToRecommendations?: () => void;
  onScrollToFactors?: () => void;
}

export const FarmSummaryCard: React.FC<FarmSummaryCardProps> = ({
  prediction,
  farmInput,
  onScrollToRecommendations,
  onScrollToFactors,
}) => {
  const summary = generateFarmSummary(prediction, farmInput);

  const statusVariant =
    summary.overallStatus === 'favorable'
      ? 'emerald'
      : summary.overallStatus === 'watch'
      ? 'amber'
      : 'rose';

  return (
    <Card
      variant="elevated"
      className="p-6 sm:p-7 border-l-4 border-l-emerald-600 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/50 shadow-sm"
    >
      {/* Header with Title & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {summary.title}
            </h3>
            <p className="text-xs text-slate-500">
              Clear narrative summary of your current farm evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="slate" size="sm">
            <span>{farmInput.crop_type}</span>
          </Badge>
          <Badge variant={statusVariant} size="sm">
            <span>{summary.statusBadge}</span>
          </Badge>
        </div>
      </div>

      {/* 4-Point Cohesive Farm Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-2">
        {/* Point 1: Estimated Yield Outlook */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 shrink-0 mt-0.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block mb-0.5 uppercase tracking-wider text-[10px] text-emerald-800">
              Yield Outlook
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {summary.yieldSentence}
            </p>
          </div>
        </div>

        {/* Point 2: Supporting & Constraining Drivers */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-sky-100/70 text-sky-800 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block mb-0.5 uppercase tracking-wider text-[10px] text-sky-800">
              Key Field Influences
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {summary.driversSentence}
            </p>
          </div>
        </div>

        {/* Point 3: Risk & Stress Status */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              summary.overallStatus === 'favorable'
                ? 'bg-emerald-100 text-emerald-800'
                : summary.overallStatus === 'watch'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span
              className={`font-bold block mb-0.5 uppercase tracking-wider text-[10px] ${
                summary.overallStatus === 'favorable'
                  ? 'text-emerald-800'
                  : summary.overallStatus === 'watch'
                  ? 'text-amber-800'
                  : 'text-rose-800'
              }`}
            >
              Risk Status
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {summary.riskSentence}
            </p>
          </div>
        </div>

        {/* Point 4: Action to Consider */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-emerald-700 text-white shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-emerald-900 block mb-0.5 uppercase tracking-wider text-[10px]">
              Next Step to Consider
            </span>
            <p className="text-emerald-950 leading-relaxed font-semibold">
              {summary.actionSentence}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 text-[11px]">
          Based on verified machine-learning predictions and in-situ field rules.
        </span>

        <div className="flex items-center gap-3">
          {onScrollToFactors && (
            <button
              type="button"
              onClick={onScrollToFactors}
              className="text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>See why these conditions matter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onScrollToRecommendations && (
            <button
              type="button"
              onClick={onScrollToRecommendations}
              className="text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
