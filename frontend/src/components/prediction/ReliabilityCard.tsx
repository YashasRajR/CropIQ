import React from 'react';
import { Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  const isOod = dataQuality?.out_of_distribution || dataQuality?.extrapolation_warning;

  return (
    <Card variant="elevated" className="p-6 sm:p-7 flex flex-col justify-between border-t-4 border-t-slate-400">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prediction Reliability
              </h3>
              <p className="text-xs text-slate-900 font-semibold">
                Model confidence & range
              </p>
            </div>
          </div>

          <Badge
            variant={
              isOod
                ? 'amber'
                : uncertainty.classification === 'LOW'
                ? 'emerald'
                : uncertainty.classification === 'MODERATE'
                ? 'amber'
                : 'rose'
            }
            size="sm"
          >
            <span>
              {isOod
                ? 'Outside Usual Range'
                : uncertainty.classification === 'LOW'
                ? 'High Reliability'
                : `${uncertainty.classification} Reliability`}
            </span>
          </Badge>
        </div>

        {/* Reliability Metric Details */}
        <div className="my-3 space-y-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Estimated Variation Range</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              ±{formatNumber(uncertainty.std_yield, 2)} unconfirmed
            </span>
          </div>

          {uncertainty.lower_bound !== undefined && uncertainty.upper_bound !== undefined && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Likely Range (95% Interval)</span>
              <span className="font-mono font-bold text-slate-900">
                {formatNumber(uncertainty.lower_bound, 1)} – {formatNumber(uncertainty.upper_bound, 1)}
              </span>
            </div>
          )}
        </div>

        {/* OOD or Status Disclosure */}
        {isOod ? (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold block mb-0.5">Heads up:</strong>
              These conditions are outside the range the model usually sees, so the estimate may be less reliable.
            </div>
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Within typical farm range:</strong> Observed soil and weather values match historical field observations well.
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
        Based on agreement across {uncertainty.n_trees ?? 300} ensemble decision trees.
      </div>
    </Card>
  );
};
