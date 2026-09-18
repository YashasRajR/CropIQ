import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { FarmInput, ScenarioFeaturesCatalog } from '../../types/farm';
import { ScenarioResponse } from '../../types/scenario';
import { formatNumber } from '../../utils/formatting';

interface ScenarioSimulatorProps {
  currentInput: FarmInput;
  catalog: ScenarioFeaturesCatalog | null;
  onRunScenario: (changes: Record<string, number>, scenarioName: string) => void;
  isLoading: boolean;
  activeScenarioResult: ScenarioResponse | null;
  onReset: () => void;
  targetFeature?: string;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  currentInput,
  catalog,
  onRunScenario,
  isLoading,
  activeScenarioResult,
  onReset,
  targetFeature,
}) => {
  const [selectedFeature, setSelectedFeature] = useState<string>('soil_moisture');
  const [sliderValue, setSliderValue] = useState<number>(currentInput.soil_moisture);
  const [scenarioName, setScenarioName] = useState<string>('Adjusted Soil Moisture');

  // Sync if targetFeature is passed from a recommendation button
  useEffect(() => {
    if (targetFeature) {
      setSelectedFeature(targetFeature);
      const currentVal = (currentInput as unknown as Record<string, number>)[targetFeature];
      if (currentVal !== undefined) {
        setSliderValue(currentVal);
      }
      setScenarioName(`Modified ${targetFeature.replace('_', ' ')}`);
    }
  }, [targetFeature, currentInput]);

  // When selected feature changes, update slider to current value
  const handleFeatureChange = (feature: string) => {
    setSelectedFeature(feature);
    const currentVal = (currentInput as unknown as Record<string, number>)[feature];
    if (currentVal !== undefined) {
      setSliderValue(currentVal);
    }
    setScenarioName(`Modified ${feature.replace('_', ' ')}`);
  };

  // Get feature metadata from catalog
  const fMeta = catalog?.features[selectedFeature];
  const minVal = fMeta?.slider.min ?? (selectedFeature === 'soil_moisture' ? 10 : 0);
  const maxVal = fMeta?.slider.max ?? (selectedFeature === 'soil_moisture' ? 60 : 100);
  const stepVal = fMeta?.slider.step ?? 0.5;
  const currentVal = (currentInput as unknown as Record<string, number>)[selectedFeature] ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunScenario({ [selectedFeature]: sliderValue }, scenarioName);
  };

  const applyPreset = (targetVal: number, name: string) => {
    setSliderValue(targetVal);
    setScenarioName(name);
  };

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="scenario-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Try a Different Situation
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            See how the model's estimated yield changes when a farm condition changes.
          </p>
        </div>

        {activeScenarioResult && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset to Current
          </Button>
        )}
      </div>

      {/* Non-Causal Epistemic Disclosure */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong className="font-semibold text-amber-900 block mb-0.5">
            This is an estimate, not a promise
          </strong>
          This tool shows what the model would predict if a condition were different. It's based on patterns in past data, not a guarantee of what will happen if you change something in the field.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Col 1: Select Variable to Change */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 block">
                Condition to Test
              </label>
              <select
                value={selectedFeature}
                onChange={(e) => handleFeatureChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="soil_moisture">💧 Soil Moisture (%)</option>
                <option value="rainfall">🌧️ Recent Rainfall (mm)</option>
                <option value="temperature">☀️ Temperature (°C)</option>
                <option value="SAVI">🌿 Crop Greenness (from satellite)</option>
                <option value="NDVI">🌱 Plant Health (from satellite)</option>
              </select>
            </div>

            {/* Current Value Display */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Your Current Value:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatNumber(currentVal, 2)} {fMeta?.unit || ''}
              </span>
            </div>

            {/* Controllability Note */}
            <div className="text-xs text-slate-500 leading-relaxed">
              {selectedFeature === 'soil_moisture'
                ? '💡 Soil moisture can often be influenced by irrigation and mulch management.'
                : selectedFeature === 'rainfall' || selectedFeature === 'temperature'
                ? '🌤️ Weather conditions are seasonal and outside direct farm control.'
                : '🌿 Canopy vegetation vigor reflects overall crop stand health.'}
            </div>
          </div>

          {/* Col 2 & 3: Interactive Slider & Presets */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hypothetical Value
                </span>
                <Tooltip content="Drag the slider to choose the hypothetical condition you'd like to evaluate." />
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs text-slate-500">Selected:</span>
                <span className="text-lg font-bold text-emerald-800">
                  {formatNumber(sliderValue, 2)} {fMeta?.unit || ''}
                </span>
              </div>
            </div>

            {/* Slider Track */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <input
                type="range"
                min={minVal}
                max={maxVal}
                step={stepVal}
                value={sliderValue}
                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />

              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
                <span>Min: {formatNumber(minVal, 1)}</span>
                <span className="text-emerald-800 font-semibold">
                  Current: {formatNumber(currentVal, 1)}
                </span>
                <span>Max: {formatNumber(maxVal, 1)}</span>
              </div>
            </div>

            {/* Quick Situation Presets */}
            {selectedFeature === 'soil_moisture' && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500 font-medium">Quick situations:</span>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(Math.min(maxVal, currentVal + 8), 'Add Irrigation (+8%)')
                  }
                  className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                >
                  💧 Add Irrigation (+8%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(Math.max(minVal, currentVal - 6), 'Dry Spell (-6%)')
                  }
                  className="px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                >
                  ☀️ Dry Spell (-6%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(currentVal, 'Current Value')}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                size="md"
                variant="primary"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto px-6"
              >
                {isLoading ? 'Calculating scenario estimate...' : 'See the Estimate'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
};
