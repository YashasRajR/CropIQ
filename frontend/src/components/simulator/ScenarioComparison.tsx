import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ScenarioResponse } from '../../types/scenario';
import { formatNumber, formatDiff, formatPercentage } from '../../utils/formatting';

interface ScenarioComparisonProps {
  scenario: ScenarioResponse;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenario }) => {
  const { baseline, scenario: scen, comparison, interpretation, validation } = scenario;
  const isPositive = comparison.absolute_change > 0;
  const isZero = Math.abs(comparison.absolute_change) < 0.0001;

  return (
    <div className="mt-8 space-y-6 animate-in fade-in duration-300">
      {/* 3-Column Current -> New -> Difference Display */}
      <Card variant="elevated" className="p-6 sm:p-7 border-t-4 border-t-emerald-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* 1. Current Estimate */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Current Farm Estimate
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {formatNumber(baseline.predicted_yield, 2)}
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">
              {baseline.unit}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Crop Risk: <strong className="text-slate-700">{baseline.risk.level}</strong>
            </div>
          </div>

          {/* 2. Arrow to Hypothetical Estimate */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              New Scenario Estimate
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono">
              {formatNumber(scen.predicted_yield, 2)}
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">
              {scen.unit}
            </div>
            <div className="mt-2 text-[11px] text-emerald-800 font-medium">
              Crop Risk: <strong>{scen.risk.level}</strong>
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
                variant={comparison.is_material ? (isPositive ? 'emerald' : 'rose') : 'slate'}
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

        {/* Materiality Explanation */}
        <div className="mt-6 pt-5 border-t border-slate-200 text-xs leading-relaxed text-slate-700 space-y-2">
          {!comparison.is_material ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              <strong className="text-slate-900 block mb-0.5">Understanding this difference:</strong>
              This estimated change ({formatDiff(comparison.absolute_change, baseline.unit)}) is smaller than the model's normal margin of variation ({formatNumber(comparison.material_threshold, 2)} {baseline.unit}).
              In practical farming, this modest statistical fluctuation may not represent a meaningful real-world difference.
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <strong className="text-emerald-900 block mb-0.5">Noticeable shift:</strong>
              The model estimated a change of {formatDiff(comparison.absolute_change, baseline.unit)}, which exceeds the typical model noise threshold.
            </div>
          )}

          {/* Model Interpretation Summary */}
          {interpretation?.summary && (
            <p className="text-slate-600">
              <strong>Assessment: </strong>
              {interpretation.summary}
            </p>
          )}

          {/* Out of Training Range Notice */}
          {validation && !validation.within_training_range && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Outside typical range: </strong>
                This hypothetical value is outside the conditions usually seen in the training data, so this estimate has lower confidence.
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
