import React, { useState } from 'react';
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
  const [showVegDetails, setShowVegDetails] = useState(false);
  const [showWaterDetails, setShowWaterDetails] = useState(false);

  const factors = explanation.top_overall_factors || [];
  const maxMagnitude = Math.max(...factors.map((f) => Math.abs(f.contribution)), 0.1);

  // Group raw factors for vegetation & water cards
  const vegFactors = factors.filter((f) => ['NDVI', 'GNDVI', 'SAVI'].includes(f.feature));
  const waterFactors = factors.filter((f) => ['soil_moisture', 'NDWI', 'rainfall'].includes(f.feature));

  // Helper icon selector
  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'NDVI':
      case 'GNDVI':
      case 'SAVI':
        return '🌱';
      case 'soil_moisture':
        return '💧';
      case 'rainfall':
        return '🌧️';
      case 'temperature':
        return '🌡️';
      default:
        return '📍';
    }
  };

  return (
    <Card variant="elevated" className="p-6 sm:p-8 bg-white border border-slate-200/90 shadow-xs" id="factors-section">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <HelpCircle className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              What's Affecting Your Estimate?
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Visual ranking of the field conditions that have the greatest influence on your crop yield.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
          Starting point: <span className="font-mono font-bold text-slate-900">{formatNumber(explanation.baseline_yield, 1)}</span>
        </div>
      </div>

      {/* 2. Visual Horizontal Influence Ranking Bars */}
      <div className="space-y-4 my-6">
        {factors.slice(0, 5).map((f) => {
          const isPos = f.contribution >= 0;
          const tier = getInfluenceTier(f.magnitude);
          const icon = getFeatureIcon(f.feature);
          const friendlyName = getFriendlyFeatureName(f.feature || f.display_name);
          const exp = getFactorExplanation(f, cropName);
          const barWidth = Math.max(12, Math.min(100, (Math.abs(f.contribution) / maxMagnitude) * 100));

          return (
            <div key={f.feature} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              {/* Feature Title & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="font-bold text-slate-900 text-sm">{friendlyName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={tier.badgeVariant} size="sm">
                    <span>{tier.label}</span>
                  </Badge>

                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      isPos
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPos ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-amber-700" />
                    )}
                    <span>{isPos ? '+' : ''}{formatNumber(f.contribution, 2)}</span>
                  </span>
                </div>
              </div>

              {/* Horizontal Relative Influence Bar */}
              <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPos ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* One Short Sentence Underneath */}
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {exp.sentence}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Visual Grouped Cards: Vegetation & Water Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* 🌱 Vegetation Information */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <span className="text-lg">🌱</span>
              <span>Vegetation Information</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Canopy & Vigor
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            Measures the live green plant biomass, leaf density, and chlorophyll concentration across your plot.
          </p>

          <button
            type="button"
            onClick={() => setShowVegDetails(!showVegDetails)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer transition-colors pt-1"
          >
            <span>{showVegDetails ? 'Hide technical values' : 'View vegetation index readings (NDVI, GNDVI, SAVI)'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showVegDetails ? 'rotate-180' : ''}`} />
          </button>

          {showVegDetails && (
            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs font-mono space-y-1.5 animate-in fade-in duration-150">
              {vegFactors.map((vf) => (
                <div key={vf.feature} className="flex justify-between text-slate-700 text-[11px]">
                  <span>{vf.feature}:</span>
                  <span className="font-bold text-slate-900">
                    {vf.observed_value !== undefined ? formatNumber(vf.observed_value, 3) : '—'}
                    <span className="text-emerald-700 ml-2">({vf.contribution >= 0 ? '+' : ''}{formatNumber(vf.contribution, 2)})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 💧 Water & Soil Information */}
        <div className="p-5 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-950 font-bold text-sm">
              <span className="text-lg">💧</span>
              <span>Water & Soil Information</span>
            </div>
            <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
              Hydration & Moisture
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            Captures root-zone volumetric water content and recent precipitation depth to evaluate moisture stress.
          </p>

          <button
            type="button"
            onClick={() => setShowWaterDetails(!showWaterDetails)}
            className="text-xs font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1 cursor-pointer transition-colors pt-1"
          >
            <span>{showWaterDetails ? 'Hide technical values' : 'View moisture & rainfall values'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWaterDetails ? 'rotate-180' : ''}`} />
          </button>

          {showWaterDetails && (
            <div className="p-3 rounded-xl bg-white border border-sky-200 text-xs font-mono space-y-1.5 animate-in fade-in duration-150">
              {waterFactors.map((wf) => (
                <div key={wf.feature} className="flex justify-between text-slate-700 text-[11px]">
                  <span>{wf.feature}:</span>
                  <span className="font-bold text-slate-900">
                    {wf.observed_value !== undefined ? formatNumber(wf.observed_value, 2) : '—'}
                    <span className="text-sky-700 ml-2">({wf.contribution >= 0 ? '+' : ''}{formatNumber(wf.contribution, 2)})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Progressive Disclosure: Full Technical Feature Attributions & SHAP */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>Technical Feature Attributions & SHAP Details</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              showTechnical ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showTechnical && (
          <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-3 animate-in fade-in duration-150">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Attribution Method:</span>
              <span className="text-emerald-400 font-bold">{explanation.method}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Baseline Yield:</span>
              <span className="text-slate-200">{formatNumber(explanation.baseline_yield, 4)} unconfirmed</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Identity Verified:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{explanation.explanation_identity_verified ? 'TRUE (Exact sum match)' : 'APPROX'}</span>
              </span>
            </div>

            <div className="pt-2">
              <div className="text-slate-400 font-semibold mb-2">Raw Attributions Table:</div>
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
                          {f.observed_value !== undefined ? formatNumber(f.observed_value, 2) : '—'}
                        </td>
                        <td className={`py-1 font-bold ${f.contribution >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {f.contribution >= 0 ? '+' : ''}{f.contribution.toFixed(4)}
                        </td>
                        <td className="py-1 uppercase text-slate-400 text-[10px]">{f.direction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
              {explanation.non_causal_statement}
            </div>
          </div>
        )}
      </div>

      {/* Non-Causal Advisory */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Understanding influence: </strong>
          These bars show patterns CropIQ found in past harvests, not proven cause-and-effect. They highlight which conditions mattered most for this estimate.
        </span>
      </div>
    </Card>
  );
};
