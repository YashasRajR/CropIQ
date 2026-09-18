import React, { useState } from 'react';
import { TrendingUp, BarChart3, CheckCircle, ChevronDown, Cpu } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { PredictionValue, ContextPayload } from '../../types/prediction';
import { FeatureContribution } from '../../types/explanation';
import { formatNumber, displayUnit } from '../../utils/formatting';
import { explainPrediction } from '../../utils/explanations';

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
  topPositive,
  topNegative,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const { headline, meaning, whyEstimate } = explainPrediction(
    prediction.yield,
    prediction.unit,
    context,
    topPositive,
    topNegative
  );

  return (
    <Card
      variant="elevated"
      className="p-6 sm:p-7 flex flex-col justify-between border-t-4 border-t-emerald-600 bg-white"
    >
      <div>
        {/* 1. Header: What Happened? */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Estimated Yield
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
          </div>
        </div>

        {/* 2. Prominent Farmer-Friendly Outcome */}
        <div className="my-4">
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
            {headline}
          </div>
          {/* 3. What does it mean? */}
          <p className="text-xs text-slate-700 mt-3 leading-relaxed font-medium">
            {meaning}
          </p>
        </div>

        {/* 4. Why this estimate? */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 text-xs text-emerald-950 mb-4">
          <span className="font-bold text-emerald-900 block mb-1 uppercase tracking-wider text-[10px]">
            Why this estimate?
          </span>
          <p className="text-[11px] leading-relaxed text-emerald-900">
            {whyEstimate}
          </p>
        </div>

        {/* Regional Context Comparison */}
        {context && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 mb-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Regional Benchmark:</span>
              </span>
              <span className="font-bold text-emerald-800 text-[11px]">
                {context.comparison_label || 'Typical Regional Potential'}
              </span>
            </div>

            {context.historical_mean !== undefined && (
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Historical mean for {context.crop}:</span>
                <span className="font-mono font-medium text-slate-700">
                  {formatNumber(context.historical_mean, 2)}{displayUnit(prediction.unit) && ` ${displayUnit(prediction.unit)}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 5. Progressive Disclosure: Technical Details Toggle */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical details</span>
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
                <span className="text-slate-400">Model Engine:</span>
                <span className="text-emerald-400">RandomForestRegressor</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Pipeline Version:</span>
                <span className="text-slate-300">v{modelVersion}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Raw Prediction:</span>
                <span className="text-amber-400 font-bold">{prediction.yield.toFixed(6)}</span>
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
        <span>CropIQ provides an empirical estimate based on input conditions. Actual harvest may differ.</span>
      </div>
    </Card>
  );
};
