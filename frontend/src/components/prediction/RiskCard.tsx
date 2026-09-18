import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Check, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { RiskPayload } from '../../types/prediction';

interface RiskCardProps {
  risk: RiskPayload;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const isHigh = risk.level === 'HIGH';
  const isModerate = risk.level === 'MODERATE';

  return (
    <Card
      variant="elevated"
      className={`p-6 sm:p-7 flex flex-col justify-between border-t-4 ${
        isHigh
          ? 'border-t-rose-500'
          : isModerate
          ? 'border-t-amber-500'
          : 'border-t-emerald-600'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div
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
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Crop Risk
              </h3>
              <p className="text-xs text-slate-900 font-semibold">
                Yield risk assessment
              </p>
            </div>
          </div>

          <Badge variant={isHigh ? 'rose' : isModerate ? 'amber' : 'emerald'} size="sm">
            <span>
              {isHigh ? 'High Risk' : isModerate ? 'Moderate Risk' : 'Low Risk'}
            </span>
          </Badge>
        </div>

        {/* Risk Score Display */}
        <div className="my-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Risk Severity Score</span>
            <span className="text-2xl font-black font-mono text-slate-900">
              {risk.score !== undefined ? `${risk.score} / 100` : risk.level}
            </span>
          </div>

          {/* Clean Progress Meter */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHigh
                  ? 'bg-rose-500'
                  : isModerate
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.max(8, Math.min(100, risk.score ?? 20))}%` }}
            />
          </div>
        </div>

        {/* Plain-Language Explanations */}
        <div className="space-y-2 mt-4 text-xs">
          {/* Protective factors */}
          {risk.protective_factors && risk.protective_factors.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-950">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-emerald-900">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>What is protecting your crop:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                {risk.protective_factors.join('. ')}
              </p>
            </div>
          )}

          {/* Risk drivers */}
          {risk.drivers && risk.drivers.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-950">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-900">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Conditions to watch closely:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {risk.drivers.join('. ')}
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
              No acute stress factors detected for current plot readings.
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
        Evaluates moisture deficit, canopy stress, and temperature bounds.
      </div>
    </Card>
  );
};
