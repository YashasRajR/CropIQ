import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, AlertTriangle, Play, Sparkles, HelpCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
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
  onReset,
  targetFeature,
}) => {
  const [selectedFeature, setSelectedFeature] = useState<string>('soil_moisture');
  const [sliderValue, setSliderValue] = useState<number>(currentInput.soil_moisture);
  const [scenarioName, setScenarioName] = useState<string>('Irrigation Intervention');

  // Sync if targetFeature is passed from a recommendation button
  useEffect(() => {
    if (targetFeature) {
      setSelectedFeature(targetFeature);
      const currentVal = (currentInput as unknown as Record<string, number>)[targetFeature];
      if (currentVal !== undefined) {
        setSliderValue(currentVal);
      }
      setScenarioName(`${targetFeature.replace('_', ' ').toUpperCase()} Scenario`);
    }
  }, [targetFeature, currentInput]);

  // When selected feature changes, update slider to current value
  const handleFeatureChange = (feature: string) => {
    setSelectedFeature(feature);
    const currentVal = (currentInput as unknown as Record<string, number>)[feature];
    if (currentVal !== undefined) {
      setSliderValue(currentVal);
    }
    setScenarioName(`${feature.replace('_', ' ').toUpperCase()} Scenario`);
  };

  // Get feature metadata from catalog
  const fMeta = catalog?.features[selectedFeature];
  const minVal = fMeta?.slider.min ?? (selectedFeature === 'soil_moisture' ? 10 : 0);
  const maxVal = fMeta?.slider.max ?? (selectedFeature === 'soil_moisture' ? 60 : 100);
  const stepVal = fMeta?.slider.step ?? 0.5;
  const currentVal = (currentInput as unknown as Record<string, number>)[selectedFeature] ?? 0;

  const handleApplyPreset = (name: string, val: number) => {
    setSliderValue(val);
    setScenarioName(name);
  };

  const handleRun = () => {
    onRunScenario({ [selectedFeature]: Number(sliderValue.toFixed(2)) }, scenarioName);
  };

  const isControllable = fMeta?.classification === 'ACTIONABLE_SIMULATABLE';

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="simulator-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive What-If Scenario Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Simulate how the trained CropIQ regressor responds to parameter changes on the <strong>SAME</strong> model.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Reset Baseline
        </Button>
      </div>

      {/* Non-Causal Model Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-500/30 text-xs text-slate-300 mb-6 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Model Scenario Estimate: </strong>
          Scenario differences evaluate learned statistical relationships under the trained regressor. They do not constitute guaranteed physical causation or real-world crop yield promises.
        </div>
      </div>

      {/* Feature Selector & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Col 1: Variable Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 font-mono">
            Select Scenario Variable
          </label>
          <select
            value={selectedFeature}
            onChange={(e) => handleFeatureChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          >
            <option value="soil_moisture">Soil Moisture (Farm Water Management)</option>
            <option value="rainfall">Rainfall (Weather Context)</option>
            <option value="temperature">Temperature (Thermal Context)</option>
            <option value="NDVI">NDVI (Vegetation Monitoring)</option>
            <option value="SAVI">SAVI (Canopy Reflectance)</option>
          </select>

          <div className="mt-2.5 flex items-center gap-2">
            <Badge variant={isControllable ? 'emerald' : 'sky'} size="sm">
              {fMeta?.classification || (isControllable ? 'FARM-MANAGEABLE' : 'CONTEXTUAL')}
            </Badge>
            <span className="text-[11px] text-slate-500 font-mono">
              Current: <strong className="text-slate-300">{formatNumber(currentVal, 2)}</strong>
            </span>
          </div>
        </div>

        {/* Col 2 & 3: Interactive Slider */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Target Scenario Value
              </span>
              <Tooltip content="Adjust the slider to evaluate how the model responds to hypothetical values." />
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-slate-400">Hypothetical:</span>
              <span className="text-base font-bold text-teal-400">
                {formatNumber(sliderValue, 2)} {fMeta?.unit || ''}
              </span>
            </div>
          </div>

          {/* Slider Input */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <input
              type="range"
              min={minVal}
              max={maxVal}
              step={stepVal}
              value={sliderValue}
              onChange={(e) => setSliderValue(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2">
              <span>Min: {minVal}</span>
              <span className="text-slate-400">Baseline: {formatNumber(currentVal, 1)}</span>
              <span>Max: {maxVal}</span>
            </div>
          </div>

          {/* Quick Presets Buttons */}
          {selectedFeature === 'soil_moisture' && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" /> Presets:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Improve Moisture (75th percentile)', 34.0)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              >
                Improve Moisture (34.0)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Historical Median Moisture', 27.3)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              >
                Historical Median (27.3)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Drought Stress Scenario', 15.0)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              >
                Drought Stress (15.0)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Execute Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
          <span>Executes against FastAPI endpoint <code className="text-teal-300 font-mono">POST /scenario</code>.</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleRun}
          isLoading={isLoading}
          rightIcon={<Play className="w-4 h-4 fill-current" />}
          className="w-full sm:w-auto px-8 bg-teal-600 hover:bg-teal-500 border-teal-500/30"
        >
          {isLoading ? 'Simulating Scenario...' : 'Run What-If Scenario'}
        </Button>
      </div>
    </Card>
  );
};
