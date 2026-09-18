import React from 'react';
import { History, Trash2, ArrowRight } from 'lucide-react';
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
    <Card variant="default" className="p-6 bg-white border border-slate-200 mt-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-700" />
          <h4 className="text-sm font-bold text-slate-900">
            Situations You've Tested ({history.length})
          </h4>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200 font-semibold">
              <th className="pb-2.5">Situation</th>
              <th className="pb-2.5">Condition Changed</th>
              <th className="pb-2.5">New Estimate</th>
              <th className="pb-2.5">Difference</th>
              <th className="pb-2.5">Risk</th>
              <th className="pb-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((scen, idx) => {
              const diff = scen.comparison.absolute_change;
              const isPos = diff > 0;
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectScenario(scen)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 font-bold text-slate-900">
                    {scen.scenario.name}
                  </td>
                  <td className="py-2.5 font-mono text-slate-600 text-[11px]">
                    {Object.entries(scen.scenario.changes).map(([k, v]) => (
                      <span key={k}>
                        {k.replace('_', ' ')}: {v}
                      </span>
                    ))}
                  </td>
                  <td className="py-2.5 font-mono font-bold text-slate-900">
                    {formatNumber(scen.scenario.predicted_yield, 2)}
                  </td>
                  <td className="py-2.5 font-mono font-semibold">
                    <span className={isPos ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-slate-500'}>
                      {formatDiff(diff, scen.scenario.unit)}
                    </span>
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
                  <td className="py-2.5 text-right">
                    <span className="text-emerald-700 group-hover:underline text-[11px] font-semibold inline-flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
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
