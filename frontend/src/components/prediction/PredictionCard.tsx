import React, { useState } from 'react';
import { TrendingUp, BarChart3, CheckCircle, ChevronDown, Cpu } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { PredictionValue, ContextPayload } from '../../types/prediction';
import { FeatureContribution } from '../../types/explanation';
import { formatNumber } from '../../utils/formatting';

interface PredictionCardProps {
  prediction: PredictionValue;
  context?: ContextPayload;
  modelVersion?: string;
  topPositive?: FeatureContribution;
  topNegative?: FeatureContribution;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  context,
  modelVersion = '1.0.0',
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const formattedYield = formatNumber(prediction.yield, 1);
  const crop = context?.crop || 'this crop';

  return (
    <Card
      variant="elevated"
      className="p-6 sm:p-8 flex flex-col justify-between border-t-4 border-t-emerald-600 bg-white"
    >
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Estimated Yield
              </h2>
              <span className="text-xs text-slate-800 font-semibold">
                Expected harvest potential
              </span>
            </div>
          </div>

          {context?.crop && (
            <Badge variant="emerald" size="sm">
              <span>{context.crop}</span>
            </Badge>
          )}
        </div>

        {/* Hero Visual Metric */}
        <div className="my-5 p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border border-emerald-200/80 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
            Predicted Plot Outcome
          </span>
          <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
            {formattedYield}
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-700 font-mono mt-1">
            {prediction.unit}
          </div>

          {/* Simple Explanation */}
          <p className="text-xs sm:text-sm text-slate-700 mt-3 leading-relaxed max-w-md mx-auto font-medium">
            CropIQ estimates around <strong className="text-slate-900 font-semibold">{formattedYield} {prediction.unit}</strong> of {crop} based on the farm information provided.
          </p>
        </div>

        {/* Regional Benchmark Comparison Bar if available */}
        {context && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>Regional Benchmark:</span>
              </span>
              <span className="font-bold text-emerald-800">
                {context.comparison_label || 'Regional Average Comparison'}
              </span>
            </div>

            {context.historical_mean !== undefined && (
              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                <span>Historical mean for {context.crop}:</span>
                <span className="font-mono font-medium text-slate-800">
                  {formatNumber(context.historical_mean, 1)} {prediction.unit}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progressive Disclosure: Technical Details Toggle */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical Details</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                showTechnical ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnical && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-1.5 animate-in fade-in duration-150">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Model:</span>
                <span className="text-emerald-400 font-bold">Random Forest Regressor</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Model Version:</span>
                <span className="text-slate-300">v{modelVersion}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Exact Prediction:</span>
                <span className="text-amber-400 font-bold">{prediction.yield.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Target Feature:</span>
                <span className="text-slate-300">yield</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Unit:</span>
                <span className="text-slate-300">{prediction.unit}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Transparency Note */}
      <div className="pt-3 mt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <span>Model-based estimate grounded in observed farm conditions. Actual harvest may differ.</span>
      </div>
    </Card>
  );
};
