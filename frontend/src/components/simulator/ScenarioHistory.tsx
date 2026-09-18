import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ScenarioResponse } from '../../types/scenario';
import { formatNumber, formatDiff } from '../../utils/formatting';

interface ScenarioHistoryProps {
  history: ScenarioResponse[];
  onClear: () => void;
  onSelectScenario: (scenario: ScenarioResponse) => void;
}

export const ScenarioHistory: React.FC<ScenarioHistoryProps> = ({
  history,
  onClear,
  onSelectScenario,
}) => {
  if (history.length === 0) return null;

  return (
    <Card variant="bordered" className="p-6 bg-slate-900/40 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
            Recent Scenario Trials in this Session ({history.length})
          </h4>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Trials</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="pb-2">Trial Name</th>
              <th className="pb-2">Modifications</th>
              <th className="pb-2">Estimated Yield</th>
              <th className="pb-2">Delta (ΔY)</th>
              <th className="pb-2">Risk Level</th>
              <th className="pb-2">Reliability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {history.map((scen, idx) => {
              const diff = scen.comparison.absolute_change;
              const isPos = diff > 0;
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectScenario(scen)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer text-slate-300"
                >
                  <td className="py-2.5 font-bold text-white">
                    {scen.scenario.name}
                  </td>
                  <td className="py-2.5 text-teal-300">
                    {Object.entries(scen.scenario.changes)
                      .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
                      .join(', ')}
                  </td>
                  <td className="py-2.5 font-bold text-white">
                    {formatNumber(scen.scenario.predicted_yield, 2)}
                  </td>
                  <td
                    className={`py-2.5 font-bold ${
                      Math.abs(diff) < 0.0001
                        ? 'text-slate-400'
                        : isPos
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {formatDiff(diff, '')}
                  </td>
                  <td className="py-2.5">
                    <Badge
                      variant={
                        scen.scenario.risk.level === 'HIGH'
                          ? 'rose'
                          : scen.scenario.risk.level === 'MODERATE'
                          ? 'amber'
                          : 'emerald'
                      }
                      size="sm"
                    >
                      {scen.scenario.risk.level}
                    </Badge>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[11px] text-slate-400">
                      {scen.interpretation.scenario_reliability}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
