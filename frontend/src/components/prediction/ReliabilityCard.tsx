import React, { useState } from 'react';
import { Gauge, CheckCircle2, AlertTriangle, ChevronDown, Sliders } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { UncertaintyPayload } from '../../types/prediction';
import { formatNumber } from '../../utils/formatting';

interface ReliabilityCardProps {
  uncertainty: UncertaintyPayload;
  dataQuality?: {
    warnings?: string[];
    out_of_distribution?: boolean;
    extrapolation_warning?: boolean;
  };
}

export const ReliabilityCard: React.FC<ReliabilityCardProps> = ({
  uncertainty,
  dataQuality,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const isOod = dataQuality?.out_of_distribution || dataQuality?.extrapolation_warning;

  // Reliability trust bar percentage & label
  let trustPercent = 85;
  let trustLabel = 'High Reliability';
  let badgeVariant: 'emerald' | 'amber' | 'rose' = 'emerald';
  let trustExplanation =
    'Your field conditions match patterns in thousands of real farm records, giving strong confidence to this estimate.';

  if (isOod) {
    trustPercent = 45;
    trustLabel = 'Outside Usual Range';
    badgeVariant = 'amber';
    trustExplanation =
      'Some conditions entered deviate from typical patterns in our regional database, which increases estimation uncertainty.';
  } else if (uncertainty.classification === 'MODERATE') {
    trustPercent = 65;
    trustLabel = 'Moderate Reliability';
    badgeVariant = 'amber';
    trustExplanation =
      'The current conditions are reasonably represented in the model, though local variability creates a moderate spread.';
  } else if (uncertainty.classification === 'HIGH') {
    trustPercent = 40;
    trustLabel = 'Lower Reliability';
    badgeVariant = 'rose';
    trustExplanation =
      'CropIQ is less confident than usual about this estimate for your specific mix of conditions.';
  }

  const hasBounds = uncertainty.lower_bound !== undefined && uncertainty.upper_bound !== undefined;

  return (
    <Card
      variant="elevated"
      className="p-6 sm:p-7 flex flex-col justify-between border-t-4 border-t-slate-400 bg-white"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Gauge className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estimate Reliability
              </h2>
              <span className="text-xs text-slate-800 font-semibold">
                Model confidence & trust
              </span>
            </div>
          </div>

          <Badge variant={badgeVariant} size="sm">
            <span>{trustLabel}</span>
          </Badge>
        </div>

        {/* Visual Trust Indicator Bar */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
            <span>How reliable is this estimate?</span>
            <span className="font-bold text-slate-900">{trustLabel}</span>
          </div>

          {/* Segmented / Smooth Progress Bar */}
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                badgeVariant === 'emerald'
                  ? 'bg-emerald-600'
                  : badgeVariant === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${trustPercent}%` }}
            />
          </div>

          {/* Likely Harvest Interval Slider */}
          {hasBounds && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Likely Harvest Range (95% Interval):</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatNumber(uncertainty.lower_bound, 1)} – {formatNumber(uncertainty.upper_bound, 1)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
                <div className="h-full bg-slate-600 rounded-full w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Simple Explanation Underneath */}
        <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
          {trustExplanation}
        </p>

        {/* OOD or Typical Notice */}
        {isOod ? (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-snug">
              <strong>Heads up: </strong>
              Some conditions are outside typical training boundaries, so estimate precision is wider.
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-snug">
              <strong>Typical Range: </strong>
              Observed soil and weather values fit standard field records well.
            </span>
          </div>
        )}

        {/* Progressive Disclosure: Technical Details */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical Reliability Details</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                showTechnical ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnical && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-1.5 animate-in fade-in duration-150">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Ensemble Trees:</span>
                <span className="text-emerald-400 font-bold">{uncertainty.n_trees ?? 300} decision trees</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Variation Spread:</span>
                <span className="text-amber-400">±{formatNumber(uncertainty.std_yield, 3)}</span>
              </div>
              {uncertainty.relative_uncertainty !== undefined && (
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Relative Spread:</span>
                  <span className="text-slate-300">
                    {(uncertainty.relative_uncertainty * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Extrapolation Warning:</span>
                <span className={isOod ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {isOod ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
        Based on how much CropIQ's estimates vary across similar farm conditions.
      </div>
    </Card>
  );
};
