import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ScenarioResponse } from '../../types/scenario';
import { formatNumber, formatDiff, formatPercentage } from '../../utils/formatting';
import { explainScenarioComparison } from '../../utils/explanations';

interface ScenarioComparisonProps {
  scenario: ScenarioResponse;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenario }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const { baseline, scenario: scen, comparison, validation } = scenario;
  const isPositive = comparison.absolute_change > 0;
  const isZero = Math.abs(comparison.absolute_change) < 0.0001;

  const { headline, whatChanged, whatDoesItMean, disclaimer } =
    explainScenarioComparison(scenario);

  return (
    <div className="mt-8 space-y-6 animate-in fade-in duration-300">
      <Card variant="elevated" className="p-6 sm:p-7 border-t-4 border-t-emerald-600 bg-white">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              What Happens If Conditions Change?
            </h3>
            <p className="text-xs text-slate-500">
              Comparison between your current farm baseline and this hypothetical scenario
            </p>
          </div>
          <Badge
            variant={comparison.is_material ? (isPositive ? 'emerald' : 'amber') : 'slate'}
            size="sm"
          >
            <span>{headline}</span>
          </Badge>
        </div>

        {/* 3-Column Current -> New -> Difference Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {/* 1. Current Estimate */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Current Farm Baseline
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {formatNumber(baseline.predicted_yield, 2)}
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">
              {baseline.unit}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Risk: <strong className="text-slate-700">{baseline.risk.level}</strong>
            </div>
          </div>

          {/* 2. New Scenario Estimate */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Hypothetical Scenario
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono">
              {formatNumber(scen.predicted_yield, 2)}
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">
              {scen.unit}
            </div>
            <div className="mt-2 text-[11px] text-emerald-800 font-medium">
              Risk: <strong>{scen.risk.level}</strong>
            </div>
          </div>

          {/* 3. Difference Column */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Estimated Difference
            </span>

            <div
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
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
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                {formatPercentage(comparison.percentage_change)} change
              </div>
            )}

            <div className="mt-2">
              <Badge
                variant={comparison.is_material ? (isPositive ? 'emerald' : 'amber') : 'slate'}
                size="sm"
              >
                <span>
                  {comparison.is_material
                    ? 'Noticeable Model Shift'
                    : 'Small Model Fluctuation'}
                </span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Plain-Language Explanations */}
        <div className="mt-6 pt-5 border-t border-slate-200 space-y-3 text-xs leading-relaxed">
          {/* What Changed */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1 font-semibold">What changed:</strong>
            <p className="text-slate-700">{whatChanged}</p>
          </div>

          {/* What Does It Mean */}
          <div
            className={`p-3.5 rounded-xl border ${
              comparison.is_material
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <strong className="block mb-1 font-semibold">What this means for your farm:</strong>
            <p>{whatDoesItMean}</p>
          </div>

          {/* Out of Training Range Notice */}
          {validation && !validation.within_training_range && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Outside typical observation range: </strong>
                This hypothetical value is outside the conditions usually seen in the training data, so this prediction carries higher uncertainty.
              </div>
            </div>
          )}

          {/* Non-Causal Framing Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-500 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{disclaimer}</span>
          </div>
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
              <span>Technical Scenario Details & Changed Features</span>
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
                <span className="text-slate-400">Materiality Label:</span>
                <span className="text-emerald-400 font-bold">{comparison.materiality_label}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Causal Claim Policy:</span>
                <span className="text-amber-400">NON-CAUSAL (Correlational Model Delta)</span>
              </div>

              {comparison.feature_diffs && Object.keys(comparison.feature_diffs).length > 0 && (
                <div className="pt-2">
                  <div className="text-slate-400 font-semibold mb-2">Modified Feature Values:</div>
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1">Feature</th>
                        <th className="py-1">Baseline</th>
                        <th className="py-1">Scenario</th>
                        <th className="py-1">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.entries(comparison.feature_diffs).map(([fKey, item]) => (
                        <tr key={fKey}>
                          <td className="py-1 text-slate-300">{fKey}</td>
                          <td className="py-1 text-slate-400">{formatNumber(item.baseline, 2)}</td>
                          <td className="py-1 text-slate-200 font-bold">
                            {formatNumber(item.scenario, 2)}
                          </td>
                          <td className="py-1 text-emerald-400 font-mono">
                            {formatDiff(item.difference, '')}
                          </td>
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
