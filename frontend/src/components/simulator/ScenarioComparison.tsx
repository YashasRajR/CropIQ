import React from 'react';
import { ArrowRight, Info, ShieldAlert, Sparkles } from 'lucide-react';
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
      {/* 3-Column Delta Metrics Card */}
      <Card variant="bordered" className="p-6 bg-slate-900/80 border-teal-500/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Baseline Estimate */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Baseline Observation
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">
              {formatNumber(baseline.predicted_yield, 2)}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              {baseline.unit}
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              Risk: <strong className="text-slate-300">{baseline.risk.level}</strong>
            </div>
          </div>

          {/* Arrow / Delta Indicator */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-2">
              <ArrowRight className="w-5 h-5" />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Model-Estimated Delta (ΔY)
            </span>

            <div
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                isZero
                  ? 'text-slate-400'
                  : isPositive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {formatDiff(comparison.absolute_change, baseline.unit)}
            </div>

            {comparison.percentage_change !== null && comparison.percentage_change !== undefined && (
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ({formatPercentage(comparison.percentage_change)})
              </div>
            )}
          </div>

          {/* Scenario Estimate */}
          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/40 text-center shadow-lg shadow-teal-950/30">
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block mb-1">
              {scen.name || 'Scenario Estimate'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-teal-300 font-mono">
              {formatNumber(scen.predicted_yield, 2)}
            </div>
            <div className="text-xs font-mono text-teal-400/80 mt-1">
              {scen.unit}
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Risk: <strong className="text-teal-300">{scen.risk.level}</strong>
            </div>
          </div>
        </div>

        {/* Materiality Assessment Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Badge
              variant={comparison.is_material ? 'emerald' : 'slate'}
              size="sm"
            >
              {comparison.is_material ? 'MATERIAL CHANGE' : 'SMALL FLUCTUATION'}
            </Badge>
            <span className="text-slate-300">
              {comparison.materiality_label} (Phase 2 Validation MAE: ±{comparison.material_threshold} unconfirmed)
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Scenario Reliability:</span>
            <Badge
              variant={
                interpretation.scenario_reliability === 'HIGH'
                  ? 'emerald'
                  : interpretation.scenario_reliability === 'MEDIUM'
                  ? 'amber'
                  : 'rose'
              }
              size="sm"
            >
              {interpretation.scenario_reliability}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Feature Diffs Table */}
      {comparison.feature_diffs && Object.keys(comparison.feature_diffs).length > 0 && (
        <Card variant="bordered" className="p-5 bg-slate-900/60">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Modified Parameters Breakdown</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-semibold">Variable</th>
                  <th className="pb-2 font-semibold">Baseline</th>
                  <th className="pb-2 font-semibold">Scenario</th>
                  <th className="pb-2 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {Object.entries(comparison.feature_diffs).map(([feat, diff]) => (
                  <tr key={feat} className="text-slate-300">
                    <td className="py-2.5 font-bold text-white capitalize">
                      {feat.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 text-slate-400">{formatNumber(diff.baseline, 2)}</td>
                    <td className="py-2.5 text-teal-300 font-bold">{formatNumber(diff.scenario, 2)}</td>
                    <td className="py-2.5 text-slate-200">
                      {formatDiff(diff.difference, '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Narrative Interpretation */}
      <Card variant="bordered" className="p-5 bg-slate-900/60 border-slate-800">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <div className="font-bold text-white mb-1">Model Synthesis:</div>
            <p className="mb-2">{interpretation.summary}</p>
            {validation.warnings && validation.warnings.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                {validation.warnings.map((w, i) => (
                  <div key={i} className="text-amber-400/90 text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
