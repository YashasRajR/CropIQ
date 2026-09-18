import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Check, AlertCircle, ChevronDown, Activity } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { RiskPayload } from '../../types/prediction';
import { explainRisk } from '../../utils/explanations';

interface RiskCardProps {
  risk: RiskPayload;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const isHigh = risk.level === 'HIGH';
  const isModerate = risk.level === 'MODERATE';

  const { title, badgeLabel, meaning } = explainRisk(risk);

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
        {/* 1. Header: What Happened? */}
        <div className="flex items-center justify-between gap-2 mb-3">
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
                {title}
              </h3>
              <p className="text-xs text-slate-900 font-semibold">
                Crop safety & stress level
              </p>
            </div>
          </div>

          <Badge variant={isHigh ? 'rose' : isModerate ? 'amber' : 'emerald'} size="sm">
            <span>{badgeLabel}</span>
          </Badge>
        </div>

        {/* 2. What does it mean? */}
        <div className="my-3">
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {meaning}
          </p>
        </div>

        {/* 3. Why? Protective Factors & Stress Drivers */}
        <div className="space-y-2 mt-3 text-xs">
          {/* Protective factors */}
          {risk.protective_factors && risk.protective_factors.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-emerald-900 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>What is protecting your crop:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-emerald-800 list-disc list-inside">
                {risk.protective_factors.map((factor, idx) => (
                  <li key={idx} className="leading-snug">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stress drivers */}
          {risk.drivers && risk.drivers.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-900 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Conditions to watch closely:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-amber-800 list-disc list-inside">
                {risk.drivers.map((driver, idx) => (
                  <li key={idx} className="leading-snug">
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
              No acute stress drivers detected for current farm readings.
            </div>
          )}
        </div>

        {/* 4. Progressive Disclosure: Technical Risk Details Toggle */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical risk details</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                showTechnical ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnical && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-2 animate-in fade-in duration-150">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Risk Severity Score:</span>
                <span className="text-amber-400 font-bold">
                  {risk.score !== undefined ? `${risk.score} / 100` : risk.level}
                </span>
              </div>

              {risk.component_scores && (
                <div className="space-y-1 pt-1 text-[10px]">
                  <div className="text-slate-400 font-semibold mb-1">Component Penalties:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Yield Deficit:</span>
                    <span className="text-slate-300 font-mono">
                      +{risk.component_scores.yield_deficit ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unfavorable Factors:</span>
                    <span className="text-slate-300 font-mono">
                      +{risk.component_scores.unfavorable_factors ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uncertainty Penalty:</span>
                    <span className="text-slate-300 font-mono">
                      +{risk.component_scores.uncertainty_penalty ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data Quality Penalty:</span>
                    <span className="text-slate-300 font-mono">
                      +{risk.component_scores.data_quality_penalty ?? 0}
                    </span>
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
