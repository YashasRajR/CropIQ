import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Calendar } from 'lucide-react';
import { Card } from '../common/Card';
import { PredictionHistoryPoint } from '../../types/events';

interface PredictionHistoryCardProps {
  cropName: string;
  history: PredictionHistoryPoint[];
  currentYield: number;
}

export const PredictionHistoryCard: React.FC<PredictionHistoryCardProps> = ({
  cropName,
  history,
  currentYield,
}) => {
  // Determine trajectory from first to latest point
  const firstPoint = history[0]?.yieldEstimate ?? currentYield;
  const delta = currentYield - firstPoint;
  const deltaPct = firstPoint > 0 ? (delta / firstPoint) * 100 : 0;

  const trajectoryStatus =
    Math.abs(deltaPct) < 5
      ? { label: 'Stable Outlook', icon: <Minus className="w-4 h-4 text-emerald-600" />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      : deltaPct >= 5
      ? { label: 'Upward Outlook Trend', icon: <ArrowUpRight className="w-4 h-4 text-teal-600" />, color: 'text-teal-700 bg-teal-50 border-teal-200' }
      : { label: 'Downward Outlook Trend', icon: <ArrowDownRight className="w-4 h-4 text-amber-600" />, color: 'text-amber-700 bg-amber-50 border-amber-200' };

  // Calculate scaling for mini bar chart
  const maxYield = Math.max(...history.map((h) => h.yieldEstimate), currentYield, 1) * 1.15;

  return (
    <Card variant="bordered" className="p-6 bg-white rounded-3xl border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              How Has My Outlook Changed?
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Evolution of estimated harvest yield for your <strong className="text-emerald-800">{cropName}</strong> over the season.
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold self-start sm:self-auto ${trajectoryStatus.color}`}>
          {trajectoryStatus.icon}
          <span>{trajectoryStatus.label} ({delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} t/ha)</span>
        </div>
      </div>

      {/* Visual Progression Bars */}
      <div className="space-y-3">
        {history.map((pt, idx) => {
          const barWidthPct = Math.min(100, Math.max(10, (pt.yieldEstimate / maxYield) * 100));
          const isLatest = idx === history.length - 1;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${
                isLatest
                  ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-900">{pt.weekLabel}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({pt.date})</span>
                  {isLatest && (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 self-end sm:self-auto">
                  <span className="text-base font-extrabold text-slate-900">
                    {pt.yieldEstimate.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">t/ha</span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLatest ? 'bg-emerald-600' : 'bg-emerald-800/60'
                  }`}
                  style={{ width: `${barWidthPct}%` }}
                />
              </div>

              {/* Context Event */}
              {pt.contextEvent && (
                <p className="text-[11px] text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-700">Context: </span>
                  {pt.contextEvent}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Honest Non-Causal Attribution Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-950">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important:</strong> Yield outlook adjusts when new remote sensing passes or field observations enter the system.
          Adjustments reflect updated statistical correlations across historical crop conditions; they do not imply direct single-factor causation.
        </p>
      </div>
    </Card>
  );
};
