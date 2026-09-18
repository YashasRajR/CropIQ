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
    <Card variant="default" className="p-6 sm:p-7 bg-white border border-slate-200 mt-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              How Yield Estimates Change Across Different Levels
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            See the model response curve as one farm condition varies across historical ranges.
          </p>
        </div>

        {/* Feature Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Explore condition:</span>
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="soil_moisture">Soil Moisture (%)</option>
            <option value="rainfall">Recent Rainfall (mm)</option>
            <option value="temperature">Temperature (°C)</option>
            <option value="SAVI">Crop Greenness</option>
          </select>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full my-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200 flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            <span>Calculating sensitivity curve...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-rose-600">{error}</div>
        ) : data && data.points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.points}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis
                dataKey="feature_value"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => Number(val).toFixed(1)}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={['auto', 'auto']}
                tickFormatter={(val) => Number(val).toFixed(1)}
              />
              <RechartsTooltip
                formatter={(val: number) => [
                  formatNumber(val, 2),
                  'Estimated Yield',
                ]}
                labelFormatter={(label) =>
                  `${data.display_name}: ${Number(label).toFixed(2)} ${data.unit}`
                }
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />
              {data.baseline_value !== undefined && (
                <ReferenceLine
                  x={data.baseline_value}
                  stroke="#15803d"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Current',
                    position: 'top',
                    fill: '#15803d',
                    fontSize: 11,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="predicted_yield"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#16a34a' }}
                activeDot={{ r: 6, fill: '#15803d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          This line shows how the estimate changes as this one condition varies, with everything else held the same.
          It's a model pattern, not a guarantee of what will happen in the field.
        </span>
      </div>
    </Card>
  );
};
