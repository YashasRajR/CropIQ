import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, Activity, Check, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { RiskPayload } from '../../types/prediction';

interface RiskCardProps {
  risk: RiskPayload;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const isHigh = risk.level === 'HIGH';
  const isModerate = risk.level === 'MODERATE';

  // Dynamic marker position along the Low -> Moderate -> High track
  const markerPosition =
    risk.score !== undefined
      ? Math.max(10, Math.min(90, risk.score))
      : isHigh
      ? 85
      : isModerate
      ? 50
      : 15;

  const getRiskExplanation = () => {
    if (isHigh) return 'Significant stress factors detected on the plot requiring management attention.';
    if (isModerate) return 'Some current conditions may need attention to protect yield potential.';
    return 'Growing conditions look favorable with low acute crop stress detected.';
  };

  return (
    <Card
      variant="elevated"
      className={`p-6 sm:p-7 flex flex-col justify-between border-t-4 bg-white ${
        isHigh
          ? 'border-t-rose-500'
          : isModerate
          ? 'border-t-amber-500'
          : 'border-t-emerald-600'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-xl ${
                isHigh
                  ? 'bg-rose-100 text-rose-800'
                  : isModerate
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isHigh ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isModerate ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Crop Risk
              </h2>
              <span className="text-xs text-slate-800 font-semibold">
                Yield risk assessment
              </span>
            </div>
          </div>

          <Badge variant={isHigh ? 'rose' : isModerate ? 'amber' : 'emerald'} size="sm">
            <span>{risk.level} Risk</span>
          </Badge>
        </div>

        {/* Visual Spectrum Track: Low ──── Moderate ──── High */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-2 px-1">
            <span className={!isModerate && !isHigh ? 'text-emerald-700 font-black' : ''}>
              Low
            </span>
            <span className={isModerate ? 'text-amber-700 font-black' : ''}>
              Moderate
            </span>
            <span className={isHigh ? 'text-rose-700 font-black' : ''}>
              High
            </span>
          </div>

          {/* Track Bar with Pointer Marker */}
          <div className="relative h-2.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 rounded-full shadow-inner">
            {/* Position Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-slate-900 rounded-full shadow-md flex items-center justify-center transition-all duration-500"
              style={{ left: `${markerPosition}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>
          </div>

          {/* Active Level Label */}
          <div className="text-center mt-3">
            <span
              className={`text-sm font-black uppercase tracking-wider ${
                isHigh
                  ? 'text-rose-700'
                  : isModerate
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {risk.level} Risk
            </span>
          </div>
        </div>

        {/* Simple Explanation Underneath */}
        <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
          {getRiskExplanation()}
        </p>

        {/* Compact Conditions Indicators */}
        <div className="space-y-2 mb-3">
          {risk.protective_factors && risk.protective_factors.length > 0 && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">
                <strong>Protecting crop: </strong>
                {risk.protective_factors.slice(0, 2).join(' ')}
              </span>
            </div>
          )}

          {risk.drivers && risk.drivers.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">
                <strong>To watch: </strong>
                {risk.drivers.slice(0, 2).join(' ')}
              </span>
            </div>
          )}
        </div>

        {/* Progressive Disclosure: Technical Details */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical Risk Details</span>
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
                <span className="text-slate-400">Severity Score:</span>
                <span className="text-amber-400 font-bold">
                  {risk.score !== undefined ? `${risk.score} / 100` : risk.level}
                </span>
              </div>
              {risk.component_scores && (
                <div className="space-y-1 pt-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Yield Deficit Penalty:</span>
                    <span className="text-slate-300">+{risk.component_scores.yield_deficit ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unfavorable Factors:</span>
                    <span className="text-slate-300">+{risk.component_scores.unfavorable_factors ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uncertainty Penalty:</span>
                    <span className="text-slate-300">+{risk.component_scores.uncertainty_penalty ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data Quality Penalty:</span>
                    <span className="text-slate-300">+{risk.component_scores.data_quality_penalty ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
        Based on water levels, plant health readings, and heat stress.
      </div>
    </Card>
  );
};
