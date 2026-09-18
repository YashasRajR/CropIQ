import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ScenarioResponse } from '../../types/scenario';
import { formatNumber, formatDiff, formatPercentage } from '../../utils/formatting';
import { getFriendlyFeatureName } from '../../utils/explanations';

interface ScenarioComparisonProps {
  scenario: ScenarioResponse;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenario }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const { baseline, scenario: scen, comparison, validation } = scenario;
  const isPositive = comparison.absolute_change > 0;
  const isZero = Math.abs(comparison.absolute_change) < 0.0001;

  const changedFeatures = scenario.explanation?.changed_features || Object.keys(scen.changes || {});
  const friendlyFeatureNames = changedFeatures
    .map((f) => getFriendlyFeatureName(f).toLowerCase())
    .join(' and ');

  return (
    <div className="mt-8 space-y-6 animate-in fade-in duration-300">
      <Card variant="elevated" className="p-6 sm:p-8 border-t-4 border-t-emerald-600 bg-white border border-slate-200/90 shadow-xs">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              What Happens If Conditions Change?
            </h3>
            <p className="text-xs text-slate-500">
              Visual comparison between your current farm baseline and this simulated scenario.
            </p>
          </div>
          <Badge
            variant={comparison.is_material ? (isPositive ? 'emerald' : 'amber') : 'slate'}
            size="sm"
          >
            <span>{comparison.materiality_label}</span>
          </Badge>
        </div>

        {/* Visual Before / After Flow: CURRENT ──> NEW SITUATION ──> CHANGE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* 1. CURRENT */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center relative">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Current Farm Baseline
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono my-1">
              🌾 {formatNumber(baseline.predicted_yield, 1)}
            </div>
            <div className="text-xs font-bold text-emerald-800">
              {baseline.unit}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
              Risk: <strong className="text-slate-700">{baseline.risk.level}</strong>
            </div>
          </div>

          {/* 2. NEW SITUATION */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center relative">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              New Situation
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono my-1">
              🌾 {formatNumber(scen.predicted_yield, 1)}
            </div>
            <div className="text-xs font-bold text-emerald-800">
              {scen.unit}
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/80 text-[11px] text-emerald-900">
              Risk: <strong>{scen.risk.level}</strong>
            </div>
          </div>

          {/* 3. CHANGE */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center relative">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Estimated Change
            </span>
            <div
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight my-1 ${
                isZero
                  ? 'text-slate-400'
                  : isPositive
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {formatDiff(comparison.absolute_change, baseline.unit)}
            </div>

            {comparison.percentage_change !== null && comparison.percentage_change !== undefined && (
              <div className="text-xs text-slate-600 font-semibold">
                {formatPercentage(comparison.percentage_change)} shift
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-slate-200 text-[11px]">
              <Badge
                variant={comparison.is_material ? (isPositive ? 'emerald' : 'amber') : 'slate'}
                size="sm"
              >
                <span>{comparison.is_material ? 'Noticeable Shift' : 'Minor Fluctuation'}</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Short Plain-Language Explanation */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <p className="leading-relaxed font-medium">
            When <strong className="text-slate-900">{friendlyFeatureNames || 'this input'}</strong> was changed in the model, the estimated yield changed by around <strong className="text-slate-900">{formatDiff(comparison.absolute_change, baseline.unit)}</strong>.
          </p>

          <p className="text-[11px] text-slate-500 leading-snug">
            This is a model-based scenario estimate, not a guaranteed harvest result.
          </p>

          {/* Out of Training Range Notice */}
          {validation && !validation.within_training_range && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Outside typical observation range: </strong>
                This hypothetical value deviates from historical training data, so this prediction carries wider uncertainty.
              </div>
            </div>
          )}
        </div>

        {/* Progressive Disclosure: Technical Scenario Details Toggle */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Technical Scenario Details</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform ${
                showTechnical ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnical && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-3 animate-in fade-in duration-150">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Materiality Threshold:</span>
                <span className="text-slate-200">
                  {formatNumber(comparison.material_threshold, 3)} {baseline.unit}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Policy:</span>
                <span className="text-amber-400">NON-CAUSAL (Predictive Association Delta)</span>
              </div>

              {comparison.feature_diffs && Object.keys(comparison.feature_diffs).length > 0 && (
                <div className="pt-2">
                  <div className="text-slate-400 font-semibold mb-2">Feature Adjustments:</div>
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1">Feature</th>
                        <th className="py-1">Baseline</th>
                        <th className="py-1">Scenario</th>
                        <th className="py-1">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.entries(comparison.feature_diffs).map(([fKey, item]) => (
                        <tr key={fKey}>
                          <td className="py-1 text-slate-300">{fKey}</td>
                          <td className="py-1 text-slate-400">{formatNumber(item.baseline, 2)}</td>
                          <td className="py-1 text-slate-200 font-bold">{formatNumber(item.scenario, 2)}</td>
                          <td className="py-1 text-emerald-400 font-mono">{formatDiff(item.difference, '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
