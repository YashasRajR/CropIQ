import React from 'react';
import { Gauge, CheckCircle, AlertTriangle } from 'lucide-react';
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
    <Card variant="elevated" className="p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Model Reliability & Uncertainty
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                300-Tree Ensemble Variance
              </p>
            </div>
          </div>

          <Badge
            variant={
              uncertainty.classification === 'LOW'
                ? 'emerald'
                : uncertainty.classification === 'MODERATE'
                ? 'amber'
                : 'rose'
            }
          >
            {uncertainty.classification} UNCERTAINTY
          </Badge>
        </div>

        {/* Metric Details */}
        <div className="my-3 space-y-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">Ensemble Tree Dispersion</span>
            <span className="text-sm font-bold font-mono text-slate-100">
              ±{formatNumber(uncertainty.std_yield, 2)}
            </span>
          </div>

          {uncertainty.lower_bound !== undefined && uncertainty.upper_bound !== undefined && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">Dispersion Interval (±1σ)</span>
              <span className="text-xs font-bold font-mono text-purple-300">
                [{formatNumber(uncertainty.lower_bound, 1)} — {formatNumber(uncertainty.upper_bound, 1)}]
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Training Distribution Status */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs">
          {isOod ? (
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px]">Inputs in tail or extrapolative region of training data.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px]">Inputs reside within verified training distribution.</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
