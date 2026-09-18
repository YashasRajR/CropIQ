import React from 'react';
import { TrendingUp, BarChart3, CheckCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { PredictionValue, ContextPayload } from '../../types/prediction';
import { formatNumber } from '../../utils/formatting';

interface PredictionCardProps {
  prediction: PredictionValue;
  context?: ContextPayload;
  modelVersion?: string;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  context,
  modelVersion = '1.0.0',
}) => {
  return (
    <Card variant="elevated" className="p-6 sm:p-7 flex flex-col justify-between border-t-4 border-t-emerald-600">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estimated Yield
              </h3>
              <p className="text-xs text-slate-900 font-semibold">
                Expected plot outcome
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {context?.crop && (
              <Badge variant="emerald" size="sm">
                <span>{context.crop}</span>
              </Badge>
            )}
            <Badge variant="slate" size="sm">
              <span>v{modelVersion}</span>
            </Badge>
          </div>
        </div>

        {/* Big KPI Metric */}
        <div className="my-5">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
              {formatNumber(prediction.yield, 2)}
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
              {prediction.unit}
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Calculated from observed weather, soil moisture, and vegetative vigor.
          </p>
        </div>

        {/* Historical Context Comparison */}
        {context && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Regional Benchmark:</span>
              </span>
              <span className="font-bold text-emerald-800">
                {context.comparison_label || 'High Potential'}
              </span>
            </div>

            {context.historical_mean !== undefined && (
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Historical Average for {context.crop}:</span>
                <span className="font-mono font-medium text-slate-700">
                  {formatNumber(context.historical_mean, 2)} {prediction.unit}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust & Transparency Note */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <span>CropIQ provides a model-based estimate using the information provided. Actual yield may differ.</span>
      </div>
    </Card>
  );
};
