import React, { useState } from 'react';
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
import {
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Cpu,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ExplanationResponse } from '../../types/explanation';
import { formatNumber } from '../../utils/formatting';
import {
  getFriendlyFeatureName,
  getInfluenceTier,
  getFactorExplanation,
} from '../../utils/explanations';

interface FactorChartProps {
  explanation: ExplanationResponse;
  cropName?: string;
}

export const FactorChart: React.FC<FactorChartProps> = ({
  explanation,
  cropName = 'crop',
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const factors = explanation.top_overall_factors || [];
  const positiveFactors = explanation.top_positive_factors || [];
  const negativeFactors = explanation.top_negative_factors || [];

  // Data formatted for chart with friendly names
  const chartData = factors.slice(0, 7).map((f) => ({
    rawName: f.feature,
    name: getFriendlyFeatureName(f.feature || f.display_name),
    contribution: Number(f.contribution.toFixed(2)),
    direction: f.direction,
    magnitude: Math.abs(f.contribution),
    observed: f.observed_value,
  }));

  return (
    <Card variant="elevated" className="p-6 sm:p-8 bg-white" id="factors-section">
      {/* 1. Header: What Influences Your Crop? */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              What's Influencing Your Estimate?
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Plain-language breakdown of which field conditions are boosting your yield and which are holding it back.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
          Starting point: <span className="font-mono font-bold text-slate-900">{formatNumber(explanation.baseline_yield, 2)}</span>
        </div>
      </div>

      {/* 2. Plain-Language Factor Cards with Influence Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Positive Drivers Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Conditions Helping Yield</span>
          </div>

          {positiveFactors.length > 0 ? (
            positiveFactors.slice(0, 3).map((f) => {
              const tier = getInfluenceTier(f.magnitude);
              const exp = getFactorExplanation(f, cropName);

              return (
                <div
                  key={f.feature}
                  className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 text-emerald-950 space-y-2 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {getFriendlyFeatureName(f.feature || f.display_name)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="emerald" size="sm">
                        <span>{tier.label}</span>
                      </Badge>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        +{formatNumber(f.contribution, 2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {exp.sentence}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-emerald-100">
                    <span>Observed: <strong>{f.observed_value !== undefined ? formatNumber(f.observed_value, 2) : '—'}</strong></span>
                    <span className="text-emerald-700 font-semibold">{exp.actionText}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
              No strong positive drivers detected.
            </div>
          )}
        </div>

        {/* Negative / Constraining Drivers Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
            <span>Conditions Holding Potential Back</span>
          </div>

          {negativeFactors.length > 0 ? (
            negativeFactors.slice(0, 3).map((f) => {
              const tier = getInfluenceTier(f.magnitude);
              const exp = getFactorExplanation(f, cropName);

              return (
                <div
                  key={f.feature}
                  className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 text-amber-950 space-y-2 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {getFriendlyFeatureName(f.feature || f.display_name)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="amber" size="sm">
                        <span>{tier.label}</span>
                      </Badge>
                      <span className="text-xs font-mono font-bold text-amber-700">
                        {formatNumber(f.contribution, 2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {exp.sentence}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-amber-100">
                    <span>Observed: <strong>{f.observed_value !== undefined ? formatNumber(f.observed_value, 2) : '—'}</strong></span>
                    <span className="text-amber-700 font-semibold">{exp.actionText}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
              No conditions are significantly restricting yield potential.
            </div>
          )}
        </div>
      </div>

      {/* 3. Visual Influence Bar Chart */}
      <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-800">
            Relative Influence on Yield Estimate
          </span>
          <span className="text-slate-500 text-[11px]">
            Green = Helping (+) | Amber = Holding Back (-)
          </span>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
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
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={135}
                />
                <RechartsTooltip
                  formatter={(val: number) => [
                    `${val > 0 ? '+' : ''}${formatNumber(val, 2)}`,
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
      </div>

      {/* 4. Progressive Disclosure: Technical SHAP Attributions Toggle */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>Technical Feature Attributions & SHAP Values</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              showTechnical ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showTechnical && (
          <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-slate-400">Attribution Method:</span>
              <span className="text-emerald-400 font-bold">{explanation.method}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-slate-400">Baseline Expected Value:</span>
              <span className="text-slate-200 font-mono">
                {formatNumber(explanation.baseline_yield, 4)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-slate-400">Identity Verified:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {explanation.explanation_identity_verified ? 'TRUE (sum equals prediction)' : 'APPROX'}
                </span>
              </span>
            </div>

            <div className="pt-2">
              <div className="text-slate-400 font-semibold mb-2">Raw Feature Attribution Table:</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">Feature</th>
                      <th className="py-1">Observed</th>
                      <th className="py-1">Contribution</th>
                      <th className="py-1">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {factors.map((f) => (
                      <tr key={f.feature}>
                        <td className="py-1 text-slate-300">{f.feature}</td>
                        <td className="py-1 text-slate-400">
                          {f.observed_value !== undefined ? formatNumber(f.observed_value, 3) : '—'}
                        </td>
                        <td
                          className={`py-1 font-bold ${
                            f.contribution >= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {f.contribution >= 0 ? '+' : ''}
                          {f.contribution.toFixed(4)}
                        </td>
                        <td className="py-1 uppercase text-slate-400 text-[10px]">{f.direction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 leading-relaxed border-t border-slate-800">
              {explanation.non_causal_statement}
            </div>
          </div>
        )}
      </div>

      {/* Non-Causal Disclosures */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Understanding these influences: </strong>
          These are patterns CropIQ found in past farm data, not proven cause-and-effect. Use them alongside your own field knowledge.
        </span>
      </div>
    </Card>
  );
};
