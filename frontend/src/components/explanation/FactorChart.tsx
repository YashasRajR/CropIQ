import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Sparkles, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../common/Card';
import { ExplanationResponse } from '../../types/explanation';
import { formatNumber } from '../../utils/formatting';

interface FactorChartProps {
  explanation: ExplanationResponse;
}

export const FactorChart: React.FC<FactorChartProps> = ({ explanation }) => {
  // Format data for Recharts horizontal bar chart
  const factors = explanation.top_overall_factors || [];

  const chartData = factors.slice(0, 8).map((f) => ({
    name: f.display_name || f.feature,
    contribution: Number(f.contribution.toFixed(3)),
    direction: f.direction,
    magnitude: Math.abs(f.contribution),
    observed: f.observed_value,
  }));

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="factors-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Why this prediction? (Local Feature Attributions)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            TreeSHAP feature contributions relative to model training baseline ({formatNumber(explanation.baseline_yield, 2)} unconfirmed).
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
          Method: <span className="text-purple-300 font-semibold">{explanation.method}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full my-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
              <RechartsTooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 border border-slate-750 text-xs rounded-xl shadow-xl font-mono">
                        <div className="font-bold text-white mb-1">{data.name}</div>
                        <div className="text-slate-300">
                          Contribution: <span className={data.contribution >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {data.contribution > 0 ? '+' : ''}{data.contribution}
                          </span>
                        </div>
                        {data.observed !== undefined && (
                          <div className="text-slate-400 mt-0.5">
                            Observed Value: {formatNumber(data.observed, 2)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.contribution >= 0 ? '#10b981' : '#f43f5e'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No local feature attribution data available for this observation.
          </div>
        )}
      </div>

      {/* Grid of Key Factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-800/80">
        {factors.slice(0, 6).map((f) => {
          const isPositive = f.direction === 'positive' || f.contribution > 0;
          return (
            <div
              key={f.feature}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {f.display_name || f.feature}
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {f.contribution > 0 ? '+' : ''}
                  {formatNumber(f.contribution, 2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {f.interpretation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Non-Causal Disclosure */}
      <div className="mt-6 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
        <span>{explanation.non_causal_statement}</span>
      </div>
    </Card>
  );
};
