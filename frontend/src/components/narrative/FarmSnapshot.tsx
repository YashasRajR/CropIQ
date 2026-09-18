import React from 'react';
import { Sprout, Droplets, CloudRain, Thermometer, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { PredictionResponse } from '../../types/prediction';
import { FarmInput, ScenarioFeaturesCatalog } from '../../types/farm';
import { formatNumber, displayUnit } from '../../utils/formatting';

interface FarmSnapshotProps {
  prediction: PredictionResponse;
  farmInput: FarmInput;
  scenarioCatalog?: ScenarioFeaturesCatalog | null;
}

export const FarmSnapshot: React.FC<FarmSnapshotProps> = ({
  prediction,
  farmInput,
  scenarioCatalog,
}) => {
  const { yield: yieldVal, unit } = prediction.prediction;
  const risk = prediction.risk;
  const isHighRisk = risk.level === 'HIGH';
  const isModRisk = risk.level === 'MODERATE';

  // Helper to calculate percentage within actual training or feature bounds
  const getRelativePosition = (val: number, field: string, defaultMin = 0, defaultMax = 100) => {
    const feat = scenarioCatalog?.features?.[field];
    const min = feat?.training_stats?.min ?? defaultMin;
    const max = feat?.training_stats?.max ?? defaultMax;
    if (max <= min) return 50;
    const pct = ((val - min) / (max - min)) * 100;
    return Math.max(5, Math.min(95, pct));
  };

  const smPos = getRelativePosition(farmInput.soil_moisture, 'soil_moisture', 4.4, 45.0);
  const rainPos = getRelativePosition(farmInput.rainfall, 'rainfall', 0.8, 30.0);
  const tempPos = getRelativePosition(farmInput.temperature, 'temperature', 5.0, 40.0);

  // Natural status text based on observed data
  const getSoilMoistureStatus = (sm: number) => {
    if (sm < 18) return 'Below typical root range';
    if (sm > 40) return 'Ample root-zone moisture';
    return 'Balanced root moisture';
  };

  const getRainfallStatus = (r: number) => {
    if (r < 5) return 'Low recent precipitation';
    if (r > 25) return 'Generous recent rainfall';
    return 'Steady recent hydration';
  };

  const getTemperatureStatus = (t: number) => {
    if (t < 12) return 'Cool growing temperature';
    if (t > 35) return 'Elevated heat';
    return 'Comfortable thermal range';
  };

  return (
    <Card variant="elevated" className="p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs">
              🌾
            </span>
            <span>Your Farm Snapshot</span>
          </h3>
          <p className="text-xs text-slate-500">
            Quick visual overview of your crop conditions, risk, and expected yield at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm">
            <span>{farmInput.crop_type}</span>
          </Badge>
          <Badge variant={isHighRisk ? 'rose' : isModRisk ? 'amber' : 'emerald'} size="sm">
            <span>{isHighRisk ? 'High Risk' : isModRisk ? 'Moderate Risk' : 'Low Risk'}</span>
          </Badge>
        </div>
      </div>

      {/* 6-Tile Compact Visual Indicator Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Crop Species */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Crop</span>
            </div>
            <div className="text-base font-black text-slate-900 tracking-tight">
              {farmInput.crop_type}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Active cultivation
          </div>
        </div>

        {/* 2. Soil Moisture */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Soil Moisture</span>
            </div>
            <div className="text-base font-black font-mono text-slate-900">
              {formatNumber(farmInput.soil_moisture, 1)}%
            </div>
          </div>

          {/* Visual Scale Meter */}
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${smPos}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block truncate">
              {getSoilMoistureStatus(farmInput.soil_moisture)}
            </span>
          </div>
        </div>

        {/* 3. Recent Rainfall */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
              <CloudRain className="w-3.5 h-3.5 text-sky-600" />
              <span>Recent Rainfall</span>
            </div>
            <div className="text-base font-black font-mono text-slate-900">
              {formatNumber(farmInput.rainfall, 1)} mm
            </div>
          </div>

          {/* Visual Scale Meter */}
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${rainPos}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block truncate">
              {getRainfallStatus(farmInput.rainfall)}
            </span>
          </div>
        </div>

        {/* 4. Temperature */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
              <span>Temperature</span>
            </div>
            <div className="text-base font-black font-mono text-slate-900">
              {formatNumber(farmInput.temperature, 1)}°C
            </div>
          </div>

          {/* Visual Scale Meter */}
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${tempPos}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block truncate">
              {getTemperatureStatus(farmInput.temperature)}
            </span>
          </div>
        </div>

        {/* 5. Estimated Yield */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>Estimated Yield</span>
            </div>
            <div className="text-base font-black font-mono text-emerald-950">
              {formatNumber(yieldVal, 1)}
            </div>
          </div>
          {displayUnit(unit) && (
            <div className="mt-2 text-[10px] text-emerald-800 font-semibold truncate">
              {displayUnit(unit)}
            </div>
          )}
        </div>

        {/* 6. Crop Risk */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            isHighRisk
              ? 'bg-rose-50/70 border-rose-200/80 text-rose-950'
              : isModRisk
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold mb-1">
              {isHighRisk || isModRisk ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>Crop Risk</span>
            </div>
            <div className="text-base font-black tracking-tight">
              {risk.level}
            </div>
          </div>
          <div className="mt-2 text-[10px] font-medium truncate">
            {isHighRisk
              ? 'Acute stress detected'
              : isModRisk
              ? 'Conditions to monitor'
              : 'Growing well'}
          </div>
        </div>
      </div>
    </Card>
  );
};
