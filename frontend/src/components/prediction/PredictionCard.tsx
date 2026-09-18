import React from 'react';
import { TrendingUp, BarChart3, Tag } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { PredictionValue, ContextPayload } from '../../types/prediction';
import { formatNumber } from '../../utils/formatting';

interface PredictionCardProps {
  prediction: PredictionValue;
  context?: ContextPayload;
  modelVersion?: string;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  context,
  modelVersion = '1.0.0',
}) => {
  return (
    <Card variant="elevated" className="p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Estimated Crop Yield
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Model: Random Forest Regressor
              </p>
            </div>
          </div>

          <Badge variant="slate" size="sm">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>v{modelVersion}</span>
          </Badge>
        </div>

        {/* Big KPI Metric */}
        <div className="my-5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
              {formatNumber(prediction.yield, 2)}
            </span>
            <span className="text-sm sm:text-base font-mono text-emerald-400 font-semibold">
              {prediction.unit}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Learned statistical association under observed farm, weather, soil, and satellite conditions.
          </p>
        </div>
      </div>

      {/* Historical Context Comparison */}
      {context && (
        <div className="pt-4 mt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Historical Crop Median</div>
            <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">
              {formatNumber(context.historical_median, 2)} {prediction.unit}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Crop Percentile Rank</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{context.percentile_rank !== undefined ? `${context.percentile_rank.toFixed(0)}th %` : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
