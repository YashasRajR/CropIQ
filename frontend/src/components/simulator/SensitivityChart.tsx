import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Info, Loader2 } from 'lucide-react';
import { Card } from '../common/Card';
import { cropIQApi } from '../../services/api';
import { FarmInput } from '../../types/farm';
import { SensitivityResponse } from '../../types/scenario';
import { formatNumber } from '../../utils/formatting';

interface SensitivityChartProps {
  currentInput: FarmInput;
}

export const SensitivityChart: React.FC<SensitivityChartProps> = ({ currentInput }) => {
  const [selectedFeature, setSelectedFeature] = useState<string>('soil_moisture');
  const [data, setData] = useState<SensitivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSensitivity = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await cropIQApi.runSensitivity({
          current_input: currentInput,
          feature: selectedFeature,
          num_points: 12,
        });
        if (isMounted) setData(res);
      } catch (err: unknown) {
        if (isMounted) {
          const e = err as { message?: string };
          setError(e.message || 'Failed to compute sensitivity curve.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSensitivity();
    return () => {
      isMounted = false;
    };
  }, [currentInput, selectedFeature]);

  return (
    <Card variant="bordered" className="p-6 bg-slate-900/60 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              1D Feature Model Sensitivity Curve
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Sweeps feature values across historical training range [P01, P99] while holding all other variables constant.
          </p>
        </div>

        {/* Feature Dropdown */}
        <select
          value={selectedFeature}
          onChange={(e) => setSelectedFeature(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="soil_moisture">Soil Moisture</option>
          <option value="rainfall">Rainfall</option>
          <option value="temperature">Temperature</option>
          <option value="NDVI">NDVI</option>
        </select>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full my-4 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            <span>Computing model sensitivity curve...</span>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-xs text-rose-400">
            {error}
          </div>
        ) : data && data.points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.points}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <XAxis
                dataKey="feature_value"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => formatNumber(v, 1)}
                label={{
                  value: `${data.display_name} (${data.unit})`,
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#94a3b8',
                  fontSize: 11,
                }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={['auto', 'auto']}
                tickFormatter={(v) => formatNumber(v, 1)}
              />
              {data.baseline_yield && (
                <ReferenceLine
                  y={data.baseline_yield}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: `Baseline: ${formatNumber(data.baseline_yield, 2)}`,
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />
              )}
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 border border-slate-750 text-xs rounded-xl shadow-xl font-mono">
                        <div className="text-slate-400 mb-0.5">
                          {data.display_name}: <strong className="text-white">{formatNumber(pt.feature_value, 2)}</strong>
                        </div>
                        <div className="text-teal-300 font-bold">
                          Estimated Yield: {formatNumber(pt.predicted_yield, 2)} unconfirmed
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Diff from Baseline: {pt.difference > 0 ? '+' : ''}{formatNumber(pt.difference, 2)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="predicted_yield"
                stroke="#14b8a6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#14b8a6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Non-causal Disclaimer */}
      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
        <span>
          {data?.disclaimer ||
            'This curve depicts model sensitivity holding other features constant. It represents learned statistical associations, not a physical crop response curve.'}
        </span>
      </div>
    </Card>
  );
};
