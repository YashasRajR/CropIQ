import React from 'react';
import {
  Sprout,
  Droplets,
  Thermometer,
  CloudLightning,
  Waves,
  Sun,
  CloudRain,
  Bug,
  Palette,
  Camera,
  FileText,
  CheckCircle2,
  ArrowRight,
  Calendar,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { FarmInput } from '../../types/farm';
import { PredictionResponse } from '../../types/prediction';
import { ExplanationResponse } from '../../types/explanation';
import { RecommendationResponse } from '../../types/recommendation';
import { ExampleFarmProfile } from '../../config/presets';
import { ObservationType, CropStage, FarmerFeedback } from '../../types/events';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { FarmerAgreementCard } from './FarmerAgreementCard';
import { WhatWeDontKnowPanel } from './WhatWeDontKnowPanel';
import { getFriendlyFeatureName } from '../../utils/explanations';

interface MyCropTodayProps {
  currentInput: FarmInput;
  prediction: PredictionResponse | null;
  explanation?: ExplanationResponse | null;
  recommendations?: RecommendationResponse | null;
  presets?: ExampleFarmProfile[];
  onSelectPreset?: (preset: ExampleFarmProfile) => void;
  cropStage: CropStage;
  farmerFeedback: FarmerFeedback | null;
  onChangeCropStage: (stage: CropStage) => void;
  onOpenEventModal: (type: ObservationType) => void;
  onSaveFeedback: (agreement: 'agrees' | 'unsure' | 'disagrees', notes?: string) => void;
  onOpenExpertReport: () => void;
  onNavigateToTab: (tabId: string) => void;
  onExploreScenario?: (featureName: string) => void;
}

export const MyCropToday: React.FC<MyCropTodayProps> = ({
  currentInput,
  prediction,
  explanation,
  recommendations,
  presets,
  onSelectPreset,
  cropStage,
  farmerFeedback,
  onChangeCropStage,
  onOpenEventModal,
  onSaveFeedback,
  onOpenExpertReport,
  onNavigateToTab,
  onExploreScenario,
}) => {
  const yieldVal = prediction?.prediction?.yield ?? 4.2;
  const lowerBound = prediction?.uncertainty?.lower_bound ?? (yieldVal * 0.9);
  const upperBound = prediction?.uncertainty?.upper_bound ?? (yieldVal * 1.1);

  // Derive top positive and negative factors from SHAP explanation
  const positiveFactors =
    explanation?.top_positive_factors?.slice(0, 2) ||
    prediction?.explanation?.top_positive_factors?.slice(0, 2) ||
    [];
  const negativeFactors =
    explanation?.top_negative_factors?.slice(0, 2) ||
    prediction?.explanation?.top_negative_factors?.slice(0, 2) ||
    [];
  const topRecs = recommendations?.recommendations?.slice(0, 3) || [];

  // Derive simple human interpretations from real inputs
  const ndvi = currentInput.NDVI;
  const canopyStatus =
    ndvi >= 0.5
      ? { label: 'Vigorous & Dense', variant: 'emerald' as const, note: 'Canopy is green and capturing good sunlight.' }
      : ndvi >= 0.3
      ? { label: 'Moderate Coverage', variant: 'amber' as const, note: 'Normal coverage for early/mid season.' }
      : { label: 'Sparse / Stressed', variant: 'rose' as const, note: 'Vegetation index is lower than expected.' };

  const moisture = currentInput.soil_moisture;
  const moistureStatus =
    moisture >= 22 && moisture <= 38
      ? { label: 'Well Balanced', variant: 'emerald' as const, note: 'Roots have steady access to moisture.' }
      : moisture < 22
      ? { label: 'Low / Drying', variant: 'amber' as const, note: 'Soil moisture is dipping below optimal range.' }
      : { label: 'Very High / Wet', variant: 'amber' as const, note: 'Moisture is elevated; watch for aeration.' };

  const temp = currentInput.temperature;
  const tempStatus =
    temp >= 20 && temp <= 33
      ? { label: 'Comfortable', variant: 'emerald' as const, note: `${temp}°C within normal physiological bounds.` }
      : temp > 33
      ? { label: 'Elevated Heat', variant: 'amber' as const, note: `${temp}°C may induce higher water demand.` }
      : { label: 'Cool Ambient', variant: 'slate' as const, note: `${temp}°C may slow development rate.` };

  // Feature 23: "One Thing to Do Today"
  const getTodayPriorityCheck = () => {
    if (moisture < 20) {
      return {
        action: 'Check Root Moisture Depth Ahead of Scheduled Watering',
        reason: 'Soil moisture has dropped to ' + moisture.toFixed(1) + '%, which is lower than ideal for ' + currentInput.crop_type + '.',
        badge: 'Water Management',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
      };
    }
    if (temp > 33) {
      return {
        action: 'Scout Midday Foliage for Transpiration Stress & Leaf Rolling',
        reason: 'Ambient temperature is elevated at ' + temp.toFixed(1) + '°C. Check whether leaves recover posture in late afternoon.',
        badge: 'Heat Watch',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      };
    }
    if (ndvi < 0.35) {
      return {
        action: 'Perform Diagonal Field Walk to Inspect Leaf Coloration & Pests',
        reason: 'Remote sensing shows moderate canopy greenness. Check underside of leaves for early sucking pest colonies.',
        badge: 'Canopy Inspection',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      };
    }
    return {
      action: 'Conduct Routine Weekly Scouting Across Diagonal Row Crossings',
      reason: 'Canopy vigor and soil moisture are in healthy balance. Routine scouting verifies steady vegetative progress.',
      badge: 'Routine Scouting',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    };
  };

  const formatObsVal = (val: unknown): string => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') return val.toFixed(2);
    return String(val);
  };

  const todayCheck = getTodayPriorityCheck();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 0A. 1-Click Quick Farm Preset Switcher */}
      {presets && onSelectPreset && presets.length > 0 && (
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">Quick Field Preset:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
            {presets.map((p) => {
              const isSelected =
                currentInput.crop_type.toLowerCase() === p.crop.toLowerCase() &&
                (currentInput.field_id ? currentInput.field_id === p.input.field_id : true);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs font-bold ring-2 ring-emerald-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>{p.crop}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-emerald-950/60 text-emerald-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.region.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 0. Feature 23: "One Thing to Do Today" Priority Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-600">
        <div className="flex items-start gap-3.5">
          <span className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs text-amber-300 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                Today&apos;s Crop Check
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${todayCheck.badgeColor}`}>
                {todayCheck.badge}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              {todayCheck.action}
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
              <strong>Why?</strong> {todayCheck.reason}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab('decisions')}
          className="self-start md:self-center shrink-0 px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          <span>Log Decision / Action &rarr;</span>
        </button>
      </div>

      {/* 1. Crop Identity & Stage Bar */}
      <Card variant="bordered" className="p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl shadow-lg border-emerald-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold uppercase tracking-wider text-emerald-200 border border-white/20 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-300" />
                <span>My Crop Today</span>
              </span>
              <span className="text-xs text-emerald-200/80 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentInput.field_id || 'Main Plot'} ({currentInput.latitude.toFixed(3)}°N, {currentInput.longitude.toFixed(3)}°E)</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{currentInput.crop_type}</span>
              <span className="text-sm font-normal text-emerald-200/90 px-3 py-1 rounded-xl bg-black/20 border border-white/10">
                {cropStage}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              CropIQ continuously combines your ground observations, live weather, satellite greenness,
              and machine learning into an active intelligence loop.
            </p>
          </div>

          {/* Quick Stage Selector & Expert Consultation Button */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Current Growth Stage
              </label>
              <select
                value={cropStage}
                onChange={(e) => onChangeCropStage(e.target.value as CropStage)}
                className="w-full bg-emerald-950/80 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="Sowing / Seedling">🌱 Sowing / Seedling</option>
                <option value="Vegetative / Growing">🌿 Vegetative / Growing</option>
                <option value="Flowering / Squaring">🌸 Flowering / Squaring</option>
                <option value="Grain / Pod Filling">🌾 Grain / Pod Filling</option>
                <option value="Maturity / Ripening">🧺 Maturity / Ripening</option>
              </select>
              <div className="text-[10px] text-emerald-200/70 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Sown ~52 days ago &bull; Observed: {currentInput.date_of_image || 'Current'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenExpertReport}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Generate Agronomist Report</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 2. Primary Status Grid: Yield Outlook + Vital Signs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Expected Harvest Outlook */}
        <Card variant="bordered" className="p-6 lg:col-span-1 bg-white rounded-3xl border-slate-200 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Harvest Outlook
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                🤖 Model Estimate
              </span>
            </div>

            <div className="pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {yieldVal.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-500">tonnes / ha</span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Expected Range: <strong>{lowerBound.toFixed(2)} – {upperBound.toFixed(2)} t/ha</strong> (90% conf.)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-2">
              CropIQ estimates your {currentInput.crop_type} harvest could produce around {yieldVal.toFixed(2)} tonnes per hectare
              based on current canopy greenness and soil moisture levels.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateToTab('why-estimate')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Why this estimate?</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('history')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Outlook History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Right 2 Columns: 3 Vital Signs Indicators */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Vital Sign 1: Canopy Greenness */}
          <Card variant="bordered" className="p-5 bg-white rounded-2xl border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Sprout className="w-4 h-4" />
                </span>
                <Badge variant={canopyStatus.variant}>{canopyStatus.label}</Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-1">
                Canopy Greenness
              </h4>
              <div className="text-lg font-extrabold text-slate-900">
                NDVI {currentInput.NDVI.toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {canopyStatus.note}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 border-t pt-2">
              Satellite remote sensing observation
            </div>
          </Card>

          {/* Vital Sign 2: Root Moisture */}
          <Card variant="bordered" className="p-5 bg-white rounded-2xl border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Droplets className="w-4 h-4" />
                </span>
                <Badge variant={moistureStatus.variant}>{moistureStatus.label}</Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-1">
                Root Zone Moisture
              </h4>
              <div className="text-lg font-extrabold text-slate-900">
                {currentInput.soil_moisture.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {moistureStatus.note}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 border-t pt-2">
              Volumetric soil moisture level
            </div>
          </Card>

          {/* Vital Sign 3: Ambient Climate */}
          <Card variant="bordered" className="p-5 bg-white rounded-2xl border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Thermometer className="w-4 h-4" />
                </span>
                <Badge variant={tempStatus.variant}>{tempStatus.label}</Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-1">
                Ambient Weather
              </h4>
              <div className="text-lg font-extrabold text-slate-900">
                {currentInput.temperature.toFixed(1)}°C &bull; {currentInput.rainfall.toFixed(1)}mm
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {tempStatus.note}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 border-t pt-2">
              Recent meteorological conditions
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Feature 4: Farmer + AI Agreement Interaction */}
      <FarmerAgreementCard
        cropName={currentInput.crop_type}
        initialFeedback={farmerFeedback}
        onSaveFeedback={onSaveFeedback}
      />

      {/* 3B. Embedded Factor Influence & Practical Actions (Unified Decision Loop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: What's Driving Your Crop's Estimate? */}
        <Card variant="bordered" className="p-6 bg-white rounded-3xl border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  What's Driving Your Crop's Outlook?
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                SHAP Attribution
              </span>
            </div>

            {/* Top Positive Influences */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Conditions Boosting Yield</span>
              </div>
              {positiveFactors.length > 0 ? (
                positiveFactors.map((f) => (
                  <div
                    key={f.feature}
                    className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">
                        {f.display_name || getFriendlyFeatureName(f.feature)}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {f.interpretation ||
                          (f.observed_value !== undefined && f.observed_value !== null
                            ? `Current level (${formatObsVal(f.observed_value)}) supports favorable yield formation.`
                            : 'Favorable field condition.')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-[11px] shrink-0">
                      +{Math.abs(f.contribution).toFixed(2)} t/ha
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No strong boosting factors detected at current stage.</p>
              )}
            </div>

            {/* Top Limiting / Vulnerability Factors */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Conditions Limiting Yield</span>
              </div>
              {negativeFactors.length > 0 ? (
                negativeFactors.map((f) => (
                  <div
                    key={f.feature}
                    className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">
                        {f.display_name || getFriendlyFeatureName(f.feature)}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {f.interpretation ||
                          (f.observed_value !== undefined && f.observed_value !== null
                            ? `Current level (${formatObsVal(f.observed_value)}) is pulling down estimated potential.`
                            : 'Field stress factor.')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-[11px] shrink-0">
                      -{Math.abs(f.contribution).toFixed(2)} t/ha
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No significant limiting factors identified.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onNavigateToTab('simulator')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulate Adjustments in What-If &rarr;</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('technical')}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Full SHAP Breakdown
            </button>
          </div>
        </Card>

        {/* Right: Recommended Field Actions Today */}
        <Card variant="bordered" className="p-6 bg-white rounded-3xl border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Recommended Field Actions
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                FAO / ICAR Rules
              </span>
            </div>

            <div className="space-y-3">
              {topRecs.length > 0 ? (
                topRecs.map((rec) => {
                  const priorityVariant =
                    rec.priority === 'HIGH'
                      ? ('amber' as const)
                      : rec.priority === 'MEDIUM'
                      ? ('sky' as const)
                      : ('emerald' as const);

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {rec.title}
                        </span>
                        <Badge variant={priorityVariant}>{rec.priority} PRIORITY</Badge>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {rec.action}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-500 font-medium">
                          <strong>Why?</strong> {rec.summary || rec.reason}
                        </span>
                        {rec.what_if_supported && rec.what_if_variable && onExploreScenario && (
                          <button
                            type="button"
                            onClick={() => onExploreScenario(rec.what_if_variable!)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                          >
                            Simulate Action &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
                  Field vitals are within stable thresholds. Continue routine management.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateToTab('journey')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              <span>View Farm Decisions & Complete Timeline &rarr;</span>
            </button>
          </div>
        </Card>
      </div>

      {/* 4. Feature 2: "HAS ANYTHING CHANGED IN YOUR FIELD?" */}
      <Card variant="bordered" className="p-6 sm:p-8 bg-white rounded-3xl border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Has Anything Changed in Your Field?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Select what you are noticing. CropIQ provides grounded FAO/ICAR guidance, an on-ground checklist, and next steps.
            </p>
          </div>

          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
            👨‍🌾 Human Ground Truth
          </span>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onOpenEventModal('HAIL')}
            className="flex flex-col items-start p-4 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 group-hover:scale-110 transition-transform">
              <CloudLightning className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Hailstorm Damage</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Physical foliage check</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('FLOOD')}
            className="flex flex-col items-start p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700 group-hover:scale-110 transition-transform">
              <Waves className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Flooding / Waterlogging</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Root aeration guidance</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('HEAT_STRESS')}
            className="flex flex-col items-start p-4 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
              <Sun className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">High Heat Wave</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Evaporation & cooling</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('HEAVY_RAIN')}
            className="flex flex-col items-start p-4 rounded-2xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/60 hover:border-cyan-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-cyan-100 text-cyan-700 group-hover:scale-110 transition-transform">
              <CloudRain className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Heavy Rainfall</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Runoff & drainage</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('PEST_NOTICED')}
            className="flex flex-col items-start p-4 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 hover:border-rose-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-rose-100 text-rose-700 group-hover:scale-110 transition-transform">
              <Bug className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Pest Observed</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Scouting & threshold</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('LEAF_COLOR')}
            className="flex flex-col items-start p-4 rounded-2xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/60 hover:border-orange-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-orange-100 text-orange-700 group-hover:scale-110 transition-transform">
              <Palette className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Leaves Yellowing</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Chlorosis inspection</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('PHOTO_LOG')}
            className="flex flex-col items-start p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 hover:border-indigo-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Attach Field Photo</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Timeline visual log</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEventModal('CUSTOM_NOTE')}
            className="flex flex-col items-start p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all text-left group cursor-pointer"
          >
            <span className="p-2 rounded-xl bg-slate-200 text-slate-700 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-900 mt-3">Add Custom Note</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Weeding, spray, date</span>
          </button>
        </div>
      </Card>

      {/* 5. Feature 10: "WHAT SHOULD I CHECK NEXT?" Action Checklist */}
      <Card variant="bordered" className="p-6 bg-emerald-50/60 rounded-3xl border-emerald-200 space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-base font-extrabold text-emerald-950">
              What Should I Check Next in My Field?
            </h4>
            <p className="text-xs text-emerald-800">
              High-priority field checks based on your {currentInput.crop_type} growth stage and current data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 bg-white rounded-xl border border-emerald-100 text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div>
              <strong className="block text-slate-900 font-bold">Inspect Root Moisture Depth</strong>
              <span className="text-slate-600">Dig down 10–15 cm in the active root zone. Confirm soil clumps when squeezed without releasing free water.</span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-emerald-100 text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
            <div>
              <strong className="block text-slate-900 font-bold">Scout Midday Canopy Posture</strong>
              <span className="text-slate-600">Observe crop between 12:00 PM and 2:00 PM. Check if leaves roll or invert to evaluate transpiration stress.</span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-emerald-100 text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div>
              <strong className="block text-slate-900 font-bold">Examine Underside of Foliage</strong>
              <span className="text-slate-600">Check lower leaf surfaces across 5 random spots in the field for early sucking pest or mite activity.</span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-emerald-100 text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
            <div>
              <strong className="block text-slate-900 font-bold">Verify Field Drainage Outlets</strong>
              <span className="text-slate-600">Ensure boundary furrows and drainage channels remain unobstructed in case of unforecast rain.</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Feature 18: What CropIQ Does NOT Know Yet */}
      <WhatWeDontKnowPanel cropName={currentInput.crop_type} />
    </div>
  );
};
