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
import { HelpCircle, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Card } from '../common/Card';
import { ExplanationResponse } from '../../types/explanation';
import { formatNumber } from '../../utils/formatting';

interface FactorChartProps {
  explanation: ExplanationResponse;
}

export const FactorChart: React.FC<FactorChartProps> = ({ explanation }) => {
  const factors = explanation.top_overall_factors || [];

  const chartData = factors.slice(0, 7).map((f) => ({
    name: f.display_name || f.feature,
    contribution: Number(f.contribution.toFixed(2)),
    direction: f.direction,
    magnitude: Math.abs(f.contribution),
    observed: f.observed_value,
  }));

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="factors-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <HelpCircle className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              What's Affecting Your Crop?
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            These are the key conditions on your farm that have the biggest influence on your yield estimate.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
          Baseline benchmark: <span className="font-mono font-bold text-slate-900">{formatNumber(explanation.baseline_yield, 2)}</span>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="h-72 w-full my-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
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
                stroke="#334155"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={105}
              />
              <RechartsTooltip
                formatter={(val: number) => [
                  `${val > 0 ? '+' : ''}${formatNumber(val, 2)} unconfirmed`,
                  'Estimated Impact',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  color: '#0f172a',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.contribution >= 0 ? '#16a34a' : '#d97706'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No factor attributions available
          </div>
        )}
      </div>

      {/* Plain-Language Influence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        {factors.slice(0, 4).map((f) => {
          const isPos = f.direction === 'positive';
          return (
            <div
              key={f.feature}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isPos
                  ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                  : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isPos ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPos ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {f.display_name || f.feature}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isPos ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {formatNumber(f.contribution, 2)}
                  </span>
                </div>
                <div className="text-slate-600 mt-0.5">
                  {f.observed_value !== undefined && (
                    <span className="text-[11px] text-slate-500 mr-2 font-medium">
                      Observed: {f.observed_value}
                    </span>
                  )}
                  <span>
                    {isPos
                      ? 'Condition is favorable, supporting higher yield.'
                      : 'Condition is currently restricting full yield potential.'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-Causal Disclosures */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>How to read this: </strong>
          Positive values (green) indicate conditions on your farm associated with higher yields in historical records.
          Negative values (amber) indicate conditions associated with reduced yields.
          These describe mathematical model associations and are not guaranteed real-world causal effects.
        </span>
      </div>
    </Card>
  );
};
