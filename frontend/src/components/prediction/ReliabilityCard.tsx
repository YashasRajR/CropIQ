import React, { useState } from 'react';
import { Gauge, CheckCircle2, AlertTriangle, ChevronDown, Sliders } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { UncertaintyPayload } from '../../types/prediction';
import { formatNumber } from '../../utils/formatting';
import { explainReliability } from '../../utils/explanations';

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

  const { badgeLabel, badgeVariant, meaning, likelyRangeText, oodNotice } =
    explainReliability(uncertainty, dataQuality);

  return (
    <Card
      variant="elevated"
      className="p-6 sm:p-7 flex flex-col justify-between border-t-4 border-t-slate-400 bg-white"
    >
      <div>
        {/* 1. Header: What Happened? */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estimate Reliability
              </h3>
              <p className="text-xs text-slate-900 font-semibold">
                How reliable is this estimate?
              </p>
            </div>
          </div>

          <Badge variant={badgeVariant} size="sm">
            <span>{badgeLabel}</span>
          </Badge>
        </div>

        {/* 2. What does it mean? */}
        <div className="my-3">
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {meaning}
          </p>
        </div>

        {/* 3. Likely Range in Natural Language */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1 mb-3">
          <div className="font-semibold text-slate-900 flex items-center justify-between text-[11px]">
            <span>Expected Harvest Range:</span>
            {uncertainty.lower_bound !== undefined && uncertainty.upper_bound !== undefined && (
              <span className="font-mono font-bold text-slate-900">
                {formatNumber(uncertainty.lower_bound, 1)} – {formatNumber(uncertainty.upper_bound, 1)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {likelyRangeText}
          </p>
        </div>

        {/* 4. OOD Notice if applicable */}
        {oodNotice ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong className="font-semibold block mb-0.5">Note on Unusual Conditions:</strong>
              {oodNotice}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong>Standard farm range:</strong> Soil and weather values match historical field observations well.
            </div>
          </div>
        )}

        {/* 5. Progressive Disclosure: Technical Reliability Details Toggle */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical reliability details</span>
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
                <span className="text-slate-400">Ensemble Tree Count:</span>
                <span className="text-emerald-400 font-bold">{uncertainty.n_trees ?? 300} trees</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Yield Standard Deviation:</span>
                <span className="text-amber-400 font-mono">
                  ±{formatNumber(uncertainty.std_yield, 3)}
                </span>
              </div>
              {uncertainty.relative_uncertainty !== undefined && (
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Relative Variation:</span>
                  <span className="text-slate-300">
                    {(uncertainty.relative_uncertainty * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Confidence Band:</span>
                <span className="text-slate-300">
                  {formatNumber(uncertainty.lower_bound, 2)} – {formatNumber(uncertainty.upper_bound, 2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Extrapolation Flag:</span>
                <span className={isOod ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {isOod ? 'TRUE (OOD)' : 'FALSE (In-Distribution)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
        Calculated from cross-tree dispersion across the random forest ensemble.
      </div>
    </Card>
  );
};
